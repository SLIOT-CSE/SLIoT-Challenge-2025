import type { Deadlines } from "@/content/deadlines";
import { stageAt, type Stage } from "@/lib/competition";
import { generatePassword } from "@/lib/admin-password";
import {
  deadlineSettingsSchema,
  emailSchema,
  hasPdfHeader,
  newAdminSchema,
  prototypeLinkSchema,
  proposalFileSchema,
  registrationInputSchema,
  teamCodeSchema,
} from "@/lib/schemas";
import { generateTeamCode } from "@/lib/team-code";
import { MAX_PROPOSAL_BYTES } from "@/lib/team-rules";
import { auditActionGroup } from "./audit";
import { buildTeamsCsv, teamsCsvFileName } from "./csv";
import { NetworkError } from "./errors";
import { sampleHash, sampleHashMatches } from "./sample-auth";
import type { StoreState, Store } from "./store";
import type {
  ActorType,
  Admin,
  AdminAccount,
  AdminActor,
  AdminRole,
  AuditEntry,
  AuditEntryView,
  AuditFilter,
  Conflict,
  DataError,
  DeadlineSettings,
  EmailTemplate,
  ErrorCode,
  FieldChange,
  FieldIssue,
  NewAdminInput,
  OutboxEmail,
  Result,
  Settings,
  ShortlistFinalisation,
  ShortlistState,
  Submission,
  Team,
  TeamDetail,
  TeamEditInput,
  TeamFilter,
  TeamRow,
} from "./types";

// The data-access functions the screens call. Every function is async and takes and
// returns plain data, with the signatures the backend will implement in step R: only the
// bodies change. Writes return a Result instead of throwing, so forms can show exactly
// what to fix. Reads return the data (or null).

export interface CompetitionState {
  now: number;
  stage: Stage;
  shortlistState: ShortlistState;
  deadlines: Deadlines;
}

export interface ProposalUpload {
  fileName: string;
  sizeBytes: number;
  /** First bytes of the file, when the screen has them, to check for `%PDF-` */
  header?: Uint8Array;
}

export interface UploadOptions {
  /** Called with 0 to 1 as the upload goes. The real backend reports it from XMLHttpRequest */
  onProgress?: (fraction: number) => void;
  /** Aborting rejects the call with an AbortError and leaves the previous version current */
  signal?: AbortSignal;
}

/** Failed team logins (and code reminders) allowed per window, as the architecture's per-IP limit */
const RATE_LIMIT = { attempts: 5, windowMs: 15 * 60 * 1000 };

const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = (code: ErrorCode, message: string, extra: Partial<DataError> = {}): Result<never> => ({
  ok: false,
  error: { code, message, ...extra },
});

const clone = <T,>(value: T): T => structuredClone(value);

const BEFORE_DECISION: Team["stage"][] = ["registered", "proposal_submitted"];
const SHORTLISTED: Team["stage"][] = ["shortlisted", "prototype_submitted"];

export function createData(store: Store) {
  // Every call starts here: the pretend delay, then the pretend outage if the switcher has one on
  const delay = async (): Promise<void> => {
    if (store.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, store.latencyMs));
    if (store.state.settings.simulateNetworkError) throw new NetworkError();
  };

  const stageNow = (): Stage => stageAt(new Date(store.now()), store.state.settings.deadlines);

  function record(
    s: StoreState,
    actor: { type: ActorType; id: number | null },
    action: string,
    target?: { type: string; id: string | number },
    details?: Record<string, unknown>,
  ): void {
    const entry: AuditEntry = {
      id: store.nextId(),
      actorType: actor.type,
      actorId: actor.id,
      action,
      targetType: target?.type ?? null,
      targetId: target ? String(target.id) : null,
      details: details ?? null,
      createdAt: store.now(),
    };
    s.audit.push(entry);
  }

  function queueEmail(
    s: StoreState,
    teamId: number,
    toEmail: string,
    template: EmailTemplate,
    props: Record<string, string>,
  ): void {
    const email: OutboxEmail = {
      id: store.nextId(),
      teamId,
      toEmail,
      template,
      props,
      status: "pending",
      createdAt: store.now(),
    };
    s.outbox.push(email);
  }

  function row(s: StoreState, team: Team): TeamRow {
    const own = s.submissions.filter((x) => x.teamId === team.id);
    const current = (kind: Submission["kind"]) => own.find((x) => x.kind === kind && x.isCurrent) ?? null;
    return {
      ...team,
      members: s.members.filter((m) => m.teamId === team.id).sort((a, b) => a.position - b.position),
      proposal: current("proposal"),
      prototype: current("prototype"),
    };
  }

  function detail(s: StoreState, team: Team): TeamDetail {
    return {
      ...row(s, team),
      submissions: s.submissions.filter((x) => x.teamId === team.id).sort((a, b) => b.submittedAt - a.submittedAt || b.id - a.id),
    };
  }

  function sessionTeam(s: StoreState): Team | null {
    return s.session ? (s.teams.find((t) => t.id === s.session!.teamId) ?? null) : null;
  }

  /** Seconds until another try is allowed, or null while under the limit */
  function retryAfterSeconds(s: StoreState, action: string): number | null {
    const now = store.now();
    const recent = s.audit
      .filter((e) => e.actorType === "anonymous" && e.action === action && e.createdAt > now - RATE_LIMIT.windowMs)
      .sort((a, b) => a.createdAt - b.createdAt);
    if (recent.length < RATE_LIMIT.attempts) return null;
    // The window frees a slot when the oldest of the counted attempts ages out
    const oldest = recent[recent.length - RATE_LIMIT.attempts];
    return Math.max(1, Math.ceil((oldest.createdAt + RATE_LIMIT.windowMs - now) / 1000));
  }

  const rateLimited = (seconds: number) =>
    fail("rate_limited", "Too many tries. Please wait before trying again.", { retryAfterSeconds: seconds });

  const toAccount = (a: Admin): AdminAccount => ({
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    role: a.role,
    disabled: a.disabled,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
  });

  /**
   * The role check every admin function starts with. The actor must be an active account, and
   * super-admin functions need the super_admin role. The backend gets the actor from the session.
   */
  function authorise(actor: AdminActor, role: AdminRole | "any"): Result<Admin> {
    const admin = store.state.admins.find((a) => a.id === actor.id);
    if (!admin || admin.disabled) return fail("forbidden", "You need to be signed in as an organizer.");
    if (role === "super_admin" && admin.role !== "super_admin") {
      return fail("forbidden", "Only super admins can do this.");
    }
    return ok(admin);
  }

  const activeSuperAdmins = (s: StoreState) => s.admins.filter((a) => a.role === "super_admin" && !a.disabled);

  function withActorName(s: StoreState, e: AuditEntry): AuditEntryView {
    let actorName: string | null = null;
    if (e.actorType === "admin") actorName = s.admins.find((a) => a.id === e.actorId)?.displayName ?? null;
    if (e.actorType === "team") actorName = s.teams.find((t) => t.id === e.actorId)?.name ?? null;
    if (e.actorType === "system") actorName = "System";
    return { ...e, actorName };
  }

  const toIssues = (error: { issues: { path: PropertyKey[]; message: string }[] }): FieldIssue[] =>
    error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

  /** Another team already uses an email or NIC in `members` (one team per person) */
  function memberConflicts(
    s: StoreState,
    members: { position: number; email: string; nic: string | null }[],
    exceptTeamId?: number,
  ): Conflict[] {
    const others = s.members.filter((m) => m.teamId !== exceptTeamId);
    const emails = new Set(others.map((m) => m.email));
    const nics = new Set(others.map((m) => m.nic).filter((n): n is string => n !== null));
    const conflicts: Conflict[] = [];
    for (const m of members) {
      if (emails.has(m.email)) conflicts.push({ field: "email", memberPosition: m.position });
      if (m.nic && nics.has(m.nic)) conflicts.push({ field: "nic", memberPosition: m.position });
    }
    return conflicts;
  }

  const SUPER_ONLY = "super_admin" as const;

  /** The pretend upload: progress ticks over a moment (scaled by file size), stopping on abort or outage */
  async function simulateUpload(sizeBytes: number, { onProgress, signal }: UploadOptions): Promise<void> {
    const totalMs = store.latencyMs * (6 + 4 * Math.min(1, sizeBytes / MAX_PROPOSAL_BYTES));
    const ticks = totalMs > 0 ? 12 : 1;
    for (let i = 1; i <= ticks; i++) {
      if (signal?.aborted) throw new DOMException("The upload was aborted.", "AbortError");
      if (totalMs > 0) await new Promise((resolve) => setTimeout(resolve, totalMs / ticks));
      if (signal?.aborted) throw new DOMException("The upload was aborted.", "AbortError");
      if (store.state.settings.simulateNetworkError) throw new NetworkError();
      onProgress?.(i / ticks);
    }
  }

  return {
    // ---- Competition ----

    async getCompetitionState(): Promise<CompetitionState> {
      await delay();
      const { shortlistState, deadlines } = store.state.settings;
      return clone({ now: store.now(), stage: stageNow(), shortlistState, deadlines });
    },

    async getSettings(): Promise<Settings> {
      await delay();
      return clone(store.state.settings);
    },

    // ---- Registration and login ----

    async registerTeam(input: unknown): Promise<Result<{ teamId: number; code: string }>> {
      await delay();
      const stage = stageNow();
      if (stage === "before-registration") return fail("registration_not_open", "Registration hasn't opened yet.");
      if (stage !== "registration") return fail("registration_closed", "Registration has closed.");

      const parsed = registrationInputSchema.safeParse(input);
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;

      // One team per person: email and NIC are unique across all teams
      const conflicts = memberConflicts(store.state, data.members);
      if (conflicts.length > 0) {
        return fail("duplicate_member", "Someone in this team is already registered in another team.", { conflicts });
      }

      return ok(
        store.mutate((state) => {
          const existing = new Set(state.teams.map((t) => t.code));
          let code = generateTeamCode();
          while (existing.has(code)) code = generateTeamCode();

          const now = store.now();
          const teamId = store.nextId();
          state.teams.push({
            id: teamId,
            code,
            name: data.name,
            category: data.category,
            institutionName: data.institutionName,
            institutionIsOther: data.institutionIsOther,
            stage: "registered",
            shortlistMark: false,
            shortlistEmailedAt: null,
            finalistEmailedAt: null,
            createdAt: now,
            updatedAt: now,
          });
          for (const m of data.members) state.members.push({ id: store.nextId(), teamId, ...m });

          queueEmail(state, teamId, data.members[0].email, "registration_confirmed", { code, teamName: data.name });
          record(state, { type: "anonymous", id: null }, "team.registered", { type: "team", id: teamId }, { code });
          return { teamId, code };
        }),
      );
    },

    async loginWithCode(code: string): Promise<Result<{ teamId: number }>> {
      await delay();
      const wait = retryAfterSeconds(store.state, "team.login_failed");
      if (wait !== null) return rateLimited(wait);

      const parsed = teamCodeSchema.safeParse(code);
      const team = parsed.success ? store.state.teams.find((t) => t.code === parsed.data) : undefined;
      if (!team) {
        store.mutate((state) => record(state, { type: "anonymous", id: null }, "team.login_failed"));
        return fail("invalid_code", "We couldn't find a team with that code.");
      }
      return ok(
        store.mutate((state) => {
          state.session = { teamId: team.id };
          record(state, { type: "team", id: team.id }, "team.login", { type: "team", id: team.id });
          return { teamId: team.id };
        }),
      );
    },

    async logout(): Promise<void> {
      await delay();
      store.mutate((state) => {
        state.session = null;
      });
    },

    /** The team that is logged in, or null */
    async getCurrentTeam(): Promise<TeamDetail | null> {
      await delay();
      const team = sessionTeam(store.state);
      return team ? clone(detail(store.state, team)) : null;
    },

    /** "Forgot your code?": the same reply whether or not the email belongs to a team */
    async requestCodeReminder(email: string): Promise<Result<null>> {
      await delay();
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) return fail("invalid_input", "Enter a valid email address.");

      const wait = retryAfterSeconds(store.state, "team.code_reminder_requested");
      if (wait !== null) return rateLimited(wait);
      // Every request counts toward the limit, matching or not, so the limit can't be used to find emails
      store.mutate((state) => record(state, { type: "anonymous", id: null }, "team.code_reminder_requested"));

      const leader = store.state.members.find((m) => m.position === 1 && m.email === parsed.data);
      const team = leader && store.state.teams.find((t) => t.id === leader.teamId);
      if (leader && team) {
        store.mutate((state) => {
          queueEmail(state, team.id, leader.email, "code_reminder", { code: team.code, teamName: team.name });
          record(state, { type: "anonymous", id: null }, "team.code_reminder", { type: "team", id: team.id });
        });
      }
      return ok(null);
    },

    // ---- Reading teams ----

    async getTeam(teamId: number): Promise<TeamDetail | null> {
      await delay();
      const team = store.state.teams.find((t) => t.id === teamId);
      return team ? clone(detail(store.state, team)) : null;
    },

    async listTeams(filter: TeamFilter = {}): Promise<TeamRow[]> {
      await delay();
      const s = store.state;
      const needle = filter.search?.trim().toLowerCase();
      const rows = s.teams
        .filter((t) => !filter.category || t.category === filter.category)
        .filter((t) => !filter.stage || t.stage === filter.stage)
        .map((t) => row(s, t))
        .filter((r) => {
          if (!needle) return true;
          return (
            r.name.toLowerCase().includes(needle) ||
            r.code.toLowerCase().includes(needle) ||
            r.members.some(
              (m) =>
                m.fullName.toLowerCase().includes(needle) ||
                m.email.includes(needle) ||
                (m.nic?.toLowerCase().includes(needle) ?? false),
            )
          );
        });
      return clone(rows);
    },

    // ---- Team portal: submissions ----

    async uploadProposal(upload: ProposalUpload, options: UploadOptions = {}): Promise<Result<{ version: number }>> {
      await delay();
      const s = store.state;
      const team = sessionTeam(s);
      if (!team) return fail("not_logged_in", "Log in with your team code first.");
      if (!BEFORE_DECISION.includes(team.stage)) return fail("not_allowed", "This team can't submit a proposal any more.");
      if (store.now() > Date.parse(s.settings.deadlines.proposalDue)) {
        return fail("proposal_deadline_passed", "The proposal deadline has passed.");
      }

      const file = proposalFileSchema.safeParse({ fileName: upload.fileName, sizeBytes: upload.sizeBytes });
      if (!file.success) {
        return fail("invalid_input", file.error.issues[0].message, {
          issues: file.error.issues.map((i) => ({ path: "file", message: i.message })),
        });
      }
      if (upload.header && !hasPdfHeader(upload.header)) {
        return fail("invalid_input", "That file doesn't look like a PDF.", {
          issues: [{ path: "file", message: "That file doesn't look like a PDF." }],
        });
      }

      await simulateUpload(upload.sizeBytes, options);

      // The server checks again when the file arrives: the deadline may have passed during a slow upload
      if (store.now() > Date.parse(store.state.settings.deadlines.proposalDue)) {
        return fail("proposal_deadline_passed", "The proposal deadline passed while the file was uploading.");
      }

      return ok(
        store.mutate((state) => {
          const t = state.teams.find((x) => x.id === team.id)!;
          const previous = state.submissions.filter((x) => x.teamId === t.id && x.kind === "proposal");
          previous.forEach((x) => (x.isCurrent = false));
          const version = previous.length + 1;

          state.submissions.push({
            id: store.nextId(),
            teamId: t.id,
            kind: "proposal",
            version,
            isCurrent: true,
            submittedAt: store.now(),
            fileName: `${t.code} – ${t.name} – v${version}.pdf`,
            sizeBytes: upload.sizeBytes,
            driveUrl: `https://drive.google.com/sample/${t.code}-v${version}`,
            youtubeId: null,
            youtubeUrl: null,
          });
          if (t.stage === "registered") t.stage = "proposal_submitted";
          t.updatedAt = store.now();

          const leader = state.members.find((m) => m.teamId === t.id && m.position === 1)!;
          queueEmail(state, t.id, leader.email, "proposal_received", { teamName: t.name });
          record(state, { type: "team", id: t.id }, "proposal.uploaded", { type: "team", id: t.id }, { version });
          return { version };
        }),
      );
    },

    async submitPrototype(link: string): Promise<Result<{ version: number; youtubeUrl: string }>> {
      await delay();
      const s = store.state;
      const team = sessionTeam(s);
      if (!team) return fail("not_logged_in", "Log in with your team code first.");
      // Only teams with a published "shortlisted" result can submit, even while the list is reopened
      if (!SHORTLISTED.includes(team.stage)) return fail("not_allowed", "Only shortlisted teams can submit a prototype.");
      if (store.now() > Date.parse(s.settings.deadlines.prototypeDue)) {
        return fail("prototype_deadline_passed", "The prototype deadline has passed.");
      }

      const parsed = prototypeLinkSchema.safeParse(link);
      if (!parsed.success) {
        return fail("invalid_input", parsed.error.issues[0].message, {
          issues: [{ path: "link", message: parsed.error.issues[0].message }],
        });
      }
      const { youtubeId, youtubeUrl } = parsed.data;

      return ok(
        store.mutate((state) => {
          const t = state.teams.find((x) => x.id === team.id)!;
          const previous = state.submissions.filter((x) => x.teamId === t.id && x.kind === "prototype");
          previous.forEach((x) => (x.isCurrent = false));
          const version = previous.length + 1;

          state.submissions.push({
            id: store.nextId(),
            teamId: t.id,
            kind: "prototype",
            version,
            isCurrent: true,
            submittedAt: store.now(),
            fileName: null,
            sizeBytes: null,
            driveUrl: null,
            youtubeId,
            youtubeUrl,
          });
          t.stage = "prototype_submitted";
          t.updatedAt = store.now();

          const leader = state.members.find((m) => m.teamId === t.id && m.position === 1)!;
          queueEmail(state, t.id, leader.email, "prototype_received", { teamName: t.name });
          record(state, { type: "team", id: t.id }, "prototype.submitted", { type: "team", id: t.id }, { version });
          return { version, youtubeUrl };
        }),
      );
    },

    // ---- Shortlisting (super admins) ----

    /** Draft ticks. Only teams with a proposal can be ticked, and only while the list is a draft */
    async setShortlistMarks(teamIds: number[], marked: boolean, actor: AdminActor): Promise<Result<{ count: number }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      const s = store.state;
      if (s.settings.shortlistState === "finalised") {
        return fail("shortlist_finalised", "The shortlist is finalised. Reopen it to change the ticks.");
      }
      const teams = teamIds.map((id) => s.teams.find((t) => t.id === id));
      if (teams.some((t) => !t)) return fail("not_allowed", "One of those teams doesn't exist.");
      const withoutProposal = (teams as Team[]).filter((t) => !s.submissions.some((x) => x.teamId === t.id && x.kind === "proposal"));
      if (withoutProposal.length > 0) {
        return fail("no_proposal", `${withoutProposal.map((t) => t.name).join(", ")} hasn't submitted a proposal.`);
      }

      return ok(
        store.mutate((state) => {
          let count = 0;
          for (const id of teamIds) {
            const t = state.teams.find((x) => x.id === id)!;
            if (t.shortlistMark !== marked) {
              t.shortlistMark = marked;
              t.updatedAt = store.now();
              count++;
            }
          }
          record(state, { type: "admin", id: actor.id }, "shortlist.marked", { type: "team", id: teamIds.join(",") }, { marked, count });
          return { count };
        }),
      );
    },

    /** Publishes the ticks. Needs the word FINALISE, as the dialog asks for it */
    async finaliseShortlist(
      actor: AdminActor,
      confirmation: string,
    ): Promise<Result<{ shortlistedCount: number; newlyEmailedCount: number; finalisationId: number }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      if (confirmation !== "FINALISE") return fail("confirmation_required", "Type FINALISE to confirm.");
      if (store.state.settings.shortlistState === "finalised") {
        return fail("shortlist_finalised", "The shortlist is already finalised.");
      }

      return ok(
        store.mutate((state) => {
          const now = store.now();
          let newlyEmailedCount = 0;
          const shortlistedIds: number[] = [];

          for (const t of state.teams) {
            if (t.shortlistMark) {
              shortlistedIds.push(t.id);
              // A team that already sent a prototype, or is a finalist, stays at that stage
              if (t.stage !== "prototype_submitted" && t.stage !== "finalist") t.stage = "shortlisted";
              if (t.shortlistEmailedAt === null) {
                const leader = state.members.find((m) => m.teamId === t.id && m.position === 1)!;
                queueEmail(state, t.id, leader.email, "shortlisted", { teamName: t.name });
                t.shortlistEmailedAt = now;
                newlyEmailedCount++;
              }
            } else {
              // Teams that weren't shortlisted are told in their portal, not by email
              t.stage = "not_shortlisted";
            }
            t.updatedAt = now;
          }

          state.settings.shortlistState = "finalised";
          const finalisation: ShortlistFinalisation = {
            id: store.nextId(),
            finalisedBy: actor.id,
            finalisedByName: actor.name,
            finalisedAt: now,
            shortlistedCount: shortlistedIds.length,
            newlyEmailedCount,
            teamIds: shortlistedIds,
          };
          state.finalisations.push(finalisation);
          record(
            state,
            { type: "admin", id: actor.id },
            "shortlist.finalised",
            { type: "setting", id: "shortlist_state" },
            { shortlistedCount: shortlistedIds.length, newlyEmailedCount },
          );
          return { shortlistedCount: shortlistedIds.length, newlyEmailedCount, finalisationId: finalisation.id };
        }),
      );
    },

    /** Back to draft. Teams keep their published result until the next finalise */
    async reopenShortlist(actor: AdminActor): Promise<Result<null>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      if (store.state.settings.shortlistState !== "finalised") {
        return fail("shortlist_not_finalised", "The shortlist isn't finalised.");
      }
      // The shortlist is decided once, before prototypes. Reopening later could pull teams that
      // already submitted out of the competition, so it is locked as soon as one prototype exists.
      if (store.state.submissions.some((x) => x.kind === "prototype")) {
        return fail("not_allowed", "Teams have submitted prototypes, so the shortlist can no longer be reopened.");
      }
      store.mutate((state) => {
        state.settings.shortlistState = "draft";
        record(state, { type: "admin", id: actor.id }, "shortlist.reopened", { type: "setting", id: "shortlist_state" });
      });
      return ok(null);
    },

    // ---- Finalists (super admins) ----

    /**
     * Makes teams finalists. One step with no draft: needs the word FINALISTS, and only teams
     * with a prototype qualify. Each newly announced team's leader is emailed once.
     */
    async announceFinalists(
      teamIds: number[],
      actor: AdminActor,
      confirmation: string,
    ): Promise<Result<{ count: number; newlyEmailedCount: number }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      if (confirmation !== "FINALISTS") return fail("confirmation_required", "Type FINALISTS to confirm.");

      const s = store.state;
      const teams = teamIds.map((id) => s.teams.find((t) => t.id === id));
      if (teams.some((t) => !t)) return fail("not_allowed", "One of those teams doesn't exist.");
      const noPrototype = (teams as Team[]).filter(
        (t) => !s.submissions.some((x) => x.teamId === t.id && x.kind === "prototype"),
      );
      if (noPrototype.length > 0) {
        return fail("no_prototype", `${noPrototype.map((t) => t.name).join(", ")} hasn't submitted a prototype.`);
      }

      return ok(
        store.mutate((state) => {
          const now = store.now();
          let count = 0;
          let newlyEmailedCount = 0;
          for (const id of teamIds) {
            const t = state.teams.find((x) => x.id === id)!;
            if (t.stage === "finalist") continue;
            t.stage = "finalist";
            t.updatedAt = now;
            count++;
            if (t.finalistEmailedAt === null) {
              const leader = state.members.find((m) => m.teamId === t.id && m.position === 1)!;
              queueEmail(state, t.id, leader.email, "finalist", { teamName: t.name });
              t.finalistEmailedAt = now;
              newlyEmailedCount++;
            }
          }
          record(
            state,
            { type: "admin", id: actor.id },
            "finalists.announced",
            { type: "team", id: teamIds.join(",") },
            { count, newlyEmailedCount },
          );
          return { count, newlyEmailedCount };
        }),
      );
    },

    /** Corrects a mistake: finalists go back to prototype_submitted. No email is sent */
    async unmarkFinalists(teamIds: number[], actor: AdminActor): Promise<Result<{ count: number }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      const s = store.state;
      const teams = teamIds.map((id) => s.teams.find((t) => t.id === id));
      if (teams.some((t) => !t || t.stage !== "finalist")) {
        return fail("not_allowed", "Only finalists can be taken off the finalists list.");
      }

      return ok(
        store.mutate((state) => {
          for (const id of teamIds) {
            const t = state.teams.find((x) => x.id === id)!;
            t.stage = "prototype_submitted";
            t.updatedAt = store.now();
          }
          record(
            state,
            { type: "admin", id: actor.id },
            "finalists.unmarked",
            { type: "team", id: teamIds.join(",") },
            { count: teamIds.length },
          );
          return { count: teamIds.length };
        }),
      );
    },

    async listShortlistFinalisations(): Promise<ShortlistFinalisation[]> {
      await delay();
      return clone([...store.state.finalisations].sort((a, b) => b.id - a.id));
    },

    // ---- Records ----

    /** The sample "mailbox": emails the app queued, newest first */
    async listOutbox(teamId?: number): Promise<OutboxEmail[]> {
      await delay();
      const list = store.state.outbox.filter((e) => teamId === undefined || e.teamId === teamId);
      return clone(list.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id));
    },

    /** The trail for one target (the team drawer). Organizers of either role may read it */
    async getAuditLog(
      filter: { targetType?: string; targetId?: string; limit?: number } = {},
    ): Promise<AuditEntryView[]> {
      await delay();
      const s = store.state;
      const list = s.audit
        .filter((e) => !filter.targetType || e.targetType === filter.targetType)
        .filter((e) => !filter.targetId || e.targetId === filter.targetId)
        .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
        .map((e) => withActorName(s, e));
      return clone(filter.limit ? list.slice(0, filter.limit) : list);
    },

    // ---- Admin: sign in ----

    async adminLogin(username: string, password: string): Promise<Result<{ admin: AdminAccount }>> {
      await delay();
      const wait = retryAfterSeconds(store.state, "admin.login_failed");
      if (wait !== null) return rateLimited(wait);

      const name = username.trim().toLowerCase();
      const admin = store.state.admins.find((a) => a.username === name);
      // A disabled account gets the same reply as a wrong password, so it can't be told apart
      if (!admin || admin.disabled || !sampleHashMatches(password, admin.passwordHash)) {
        store.mutate((state) =>
          record(state, { type: "anonymous", id: null }, "admin.login_failed", undefined, { username: name.slice(0, 60) }),
        );
        return fail("invalid_credentials", "Wrong username or password.");
      }
      return ok(
        store.mutate((state) => {
          const a = state.admins.find((x) => x.id === admin.id)!;
          a.lastLoginAt = store.now();
          state.adminSession = { adminId: a.id };
          record(state, { type: "admin", id: a.id }, "admin.login", { type: "admin", id: a.id });
          return { admin: toAccount(a) };
        }),
      );
    },

    async adminLogout(): Promise<void> {
      await delay();
      store.mutate((state) => {
        state.adminSession = null;
      });
    },

    /** The organizer who is signed in, or null (also null once the account is disabled) */
    async getCurrentAdmin(): Promise<AdminAccount | null> {
      await delay();
      const s = store.state;
      const admin = s.adminSession ? s.admins.find((a) => a.id === s.adminSession!.adminId) : undefined;
      return admin && !admin.disabled ? clone(toAccount(admin)) : null;
    },

    // ---- Admin: editing teams ----

    /**
     * Fixes typos in a team: its name, institution and each member's details. Not the code,
     * category, stage or number of members. Runs the same rules as registration, including one
     * team per person. TODO(backend): compare `updatedAt` so two organizers can't overwrite each
     * other's edit silently.
     */
    async updateTeam(teamId: number, edit: TeamEditInput, actor: AdminActor): Promise<Result<{ changes: FieldChange[] }>> {
      await delay();
      const auth = authorise(actor, "any");
      if (!auth.ok) return auth;

      const s = store.state;
      const team = s.teams.find((t) => t.id === teamId);
      if (!team) return fail("not_found", "That team doesn't exist.");
      const current = s.members.filter((m) => m.teamId === teamId).sort((a, b) => a.position - b.position);
      if (edit.members.length !== current.length) {
        return fail("invalid_input", "Members can't be added or removed here.");
      }

      const parsed = registrationInputSchema.safeParse({
        name: edit.name,
        category: team.category,
        institutionName: edit.institutionName,
        institutionIsOther: edit.institutionIsOther,
        members: edit.members,
      });
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;

      const conflicts = memberConflicts(s, data.members, teamId);
      if (conflicts.length > 0) {
        return fail("duplicate_member", "Someone in this team is already registered in another team.", { conflicts });
      }

      const changes: FieldChange[] = [];
      const diff = (field: string, from: string | null, to: string | null) => {
        if (from !== to) changes.push({ field, from, to });
      };
      const yesNo = (value: boolean) => (value ? "yes" : "no");
      diff("name", team.name, data.name);
      diff("institutionName", team.institutionName, data.institutionName);
      diff("institutionIsOther", yesNo(team.institutionIsOther), yesNo(data.institutionIsOther));
      current.forEach((m, i) => {
        const next = data.members[i];
        const at = `member${m.position}`;
        diff(`${at}.fullName`, m.fullName, next.fullName);
        diff(`${at}.whatsapp`, m.whatsapp, next.whatsapp);
        diff(`${at}.email`, m.email, next.email);
        diff(`${at}.nic`, m.nic, next.nic);
        // In School and University teams a member's institution follows the team's, so the team-level change says it
        if (team.category === "open") {
          diff(`${at}.institutionType`, m.institutionType, next.institutionType);
          diff(`${at}.institutionName`, m.institutionName, next.institutionName);
          diff(`${at}.institutionIsOther`, yesNo(m.institutionIsOther), yesNo(next.institutionIsOther));
        }
      });
      if (changes.length === 0) return ok({ changes });

      return ok(
        store.mutate((state) => {
          const t = state.teams.find((x) => x.id === teamId)!;
          t.name = data.name;
          t.institutionName = data.institutionName;
          t.institutionIsOther = data.institutionIsOther;
          t.updatedAt = store.now();
          state.members
            .filter((m) => m.teamId === teamId)
            .forEach((m) => {
              const next = data.members[m.position - 1];
              m.fullName = next.fullName;
              m.whatsapp = next.whatsapp;
              m.email = next.email;
              m.nic = next.nic;
              m.institutionType = next.institutionType;
              m.institutionName = next.institutionName;
              m.institutionIsOther = next.institutionIsOther;
            });
          record(state, { type: "admin", id: actor.id }, "team.edited", { type: "team", id: teamId }, { changes });
          return { changes };
        }),
      );
    },

    /** Emails the team code to the leader again */
    async resendCode(teamId: number, actor: AdminActor): Promise<Result<{ toEmail: string }>> {
      await delay();
      const auth = authorise(actor, "any");
      if (!auth.ok) return auth;
      const team = store.state.teams.find((t) => t.id === teamId);
      const leader = team && store.state.members.find((m) => m.teamId === teamId && m.position === 1);
      if (!team || !leader) return fail("not_found", "That team doesn't exist.");
      return ok(
        store.mutate((state) => {
          queueEmail(state, team.id, leader.email, "code_reminder", { code: team.code, teamName: team.name });
          record(state, { type: "admin", id: actor.id }, "team.code_resent", { type: "team", id: team.id });
          return { toEmail: leader.email };
        }),
      );
    },

    // ---- Admin: exports ----

    /** The teams as CSV, in the order of `teamIds` (the table's current view), or every team */
    async exportTeamsCsv(
      teamIds: number[] | undefined,
      actor: AdminActor,
    ): Promise<Result<{ csv: string; fileName: string; count: number }>> {
      await delay();
      const auth = authorise(actor, "any");
      if (!auth.ok) return auth;
      const s = store.state;
      const teams = teamIds ? teamIds.map((id) => s.teams.find((t) => t.id === id)) : s.teams;
      if (teams.some((t) => !t)) return fail("not_found", "One of those teams doesn't exist.");
      const rows = (teams as Team[]).map((t) => row(s, t));
      return ok(
        store.mutate((state) => {
          record(state, { type: "admin", id: actor.id }, "export.csv", undefined, { count: rows.length });
          return {
            csv: buildTeamsCsv(clone(rows), { shortlistState: state.settings.shortlistState }),
            fileName: teamsCsvFileName(store.now()),
            count: rows.length,
          };
        }),
      );
    },

    /** Pretend export to the master Google Sheet: only records when it ran */
    async exportToSheets(actor: AdminActor): Promise<Result<{ exportedAt: number; count: number }>> {
      await delay();
      const auth = authorise(actor, "any");
      if (!auth.ok) return auth;
      return ok(
        store.mutate((state) => {
          const exportedAt = store.now();
          state.settings.lastSheetExportAt = exportedAt;
          record(state, { type: "admin", id: actor.id }, "export.sheets", undefined, { count: state.teams.length });
          return { exportedAt, count: state.teams.length };
        }),
      );
    },

    // ---- Admin: settings, accounts and the audit log (super admins) ----

    /** Changes deadlines. Keeps registration, proposal and prototype in that order */
    async updateSettings(patch: Partial<DeadlineSettings>, actor: AdminActor): Promise<Result<DeadlineSettings>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;

      const { registrationCloses, proposalDue, prototypeDue } = store.state.settings.deadlines;
      const next: DeadlineSettings = { registrationCloses, proposalDue, prototypeDue, ...patch };
      const parsed = deadlineSettingsSchema.safeParse(next);
      if (!parsed.success) return fail("invalid_input", "Some deadlines need fixing.", { issues: toIssues(parsed.error) });

      const keys = ["registrationCloses", "proposalDue", "prototypeDue"] as const;
      const changes: FieldChange[] = keys
        .filter((k) => store.state.settings.deadlines[k] !== next[k])
        .map((k) => ({ field: k, from: store.state.settings.deadlines[k], to: next[k] }));
      if (changes.length === 0) return ok(next);

      return ok(
        store.mutate((state) => {
          Object.assign(state.settings.deadlines, next);
          record(state, { type: "admin", id: actor.id }, "settings.updated", { type: "setting", id: "deadlines" }, { changes });
          return next;
        }),
      );
    },

    async listAdmins(actor: AdminActor): Promise<Result<AdminAccount[]>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      return ok(clone([...store.state.admins].sort((a, b) => a.id - b.id).map(toAccount)));
    },

    /** Makes an account with a generated password. The password is returned once and never stored */
    async createAdmin(
      input: NewAdminInput,
      actor: AdminActor,
    ): Promise<Result<{ admin: AdminAccount; password: string }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;

      const parsed = newAdminSchema.safeParse(input);
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;
      if (store.state.admins.some((a) => a.username === data.username)) {
        return fail("duplicate_username", "That username is taken. Choose another.", {
          issues: [{ path: "username", message: "That username is taken. Choose another." }],
        });
      }

      const password = generatePassword();
      return ok(
        store.mutate((state) => {
          const admin: Admin = {
            id: store.nextId(),
            username: data.username,
            displayName: data.displayName,
            role: data.role,
            disabled: false,
            passwordHash: sampleHash(password),
            lastLoginAt: null,
            createdAt: store.now(),
          };
          state.admins.push(admin);
          record(state, { type: "admin", id: actor.id }, "admin.created", { type: "admin", id: admin.id }, {
            username: admin.username,
            role: admin.role,
          });
          return { admin: toAccount(admin), password };
        }),
      );
    },

    /** New generated password. The old one stops working and the account's sessions end */
    async resetAdminPassword(adminId: number, actor: AdminActor): Promise<Result<{ password: string }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      if (!store.state.admins.some((a) => a.id === adminId)) return fail("not_found", "That account doesn't exist.");

      const password = generatePassword();
      return ok(
        store.mutate((state) => {
          const target = state.admins.find((a) => a.id === adminId)!;
          target.passwordHash = sampleHash(password);
          if (state.adminSession?.adminId === adminId) state.adminSession = null;
          record(state, { type: "admin", id: actor.id }, "admin.password_reset", { type: "admin", id: adminId });
          return { password };
        }),
      );
    },

    /** Disabled accounts can't log in and their sessions end. Not yourself, and not the last super admin */
    async setAdminDisabled(adminId: number, disabled: boolean, actor: AdminActor): Promise<Result<AdminAccount>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      const s = store.state;
      const target = s.admins.find((a) => a.id === adminId);
      if (!target) return fail("not_found", "That account doesn't exist.");

      if (disabled && !target.disabled) {
        if (target.id === actor.id) return fail("own_account", "You can't disable your own account.");
        if (target.role === "super_admin" && activeSuperAdmins(s).length <= 1) {
          return fail("last_super_admin", "This is the last active super admin. Make another account a super admin first.");
        }
      }
      if (target.disabled === disabled) return ok(clone(toAccount(target)));

      return ok(
        store.mutate((state) => {
          const t = state.admins.find((a) => a.id === adminId)!;
          t.disabled = disabled;
          if (disabled && state.adminSession?.adminId === adminId) state.adminSession = null;
          record(state, { type: "admin", id: actor.id }, disabled ? "admin.disabled" : "admin.enabled", {
            type: "admin",
            id: adminId,
          });
          return toAccount(t);
        }),
      );
    },

    /** Changes an account's role. The last active super admin can't be demoted */
    async setAdminRole(adminId: number, role: AdminRole, actor: AdminActor): Promise<Result<AdminAccount>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;
      const s = store.state;
      const target = s.admins.find((a) => a.id === adminId);
      if (!target) return fail("not_found", "That account doesn't exist.");
      if (target.role === role) return ok(clone(toAccount(target)));

      if (role !== "super_admin" && target.role === "super_admin" && !target.disabled && activeSuperAdmins(s).length <= 1) {
        return fail("last_super_admin", "This is the last active super admin. Make another account a super admin first.");
      }

      return ok(
        store.mutate((state) => {
          const t = state.admins.find((a) => a.id === adminId)!;
          const from = t.role;
          t.role = role;
          record(state, { type: "admin", id: actor.id }, "admin.role_changed", { type: "admin", id: adminId }, { from, to: role });
          return toAccount(t);
        }),
      );
    },

    /** The whole audit log, newest first, a page at a time */
    async listAuditLog(
      actor: AdminActor,
      filter: AuditFilter = {},
    ): Promise<Result<{ entries: AuditEntryView[]; hasMore: boolean }>> {
      await delay();
      const auth = authorise(actor, SUPER_ONLY);
      if (!auth.ok) return auth;

      const s = store.state;
      const matching = s.audit
        .filter((e) => !filter.actorType || e.actorType === filter.actorType)
        .filter((e) => filter.actorId === undefined || e.actorId === filter.actorId)
        .filter((e) => !filter.actionGroup || auditActionGroup(e.action) === filter.actionGroup)
        .filter((e) => filter.from === undefined || e.createdAt >= filter.from)
        .filter((e) => filter.to === undefined || e.createdAt <= filter.to)
        .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);

      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? 100;
      const page = matching.slice(offset, offset + limit).map((e) => withActorName(s, e));
      return ok(clone({ entries: page, hasMore: offset + limit < matching.length }));
    },
  };
}

export type Data = ReturnType<typeof createData>;
