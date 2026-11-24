import type { Deadlines } from "@/content/deadlines";
import { stageAt, type Stage } from "@/lib/competition";
import {
  emailSchema,
  hasPdfHeader,
  prototypeLinkSchema,
  proposalFileSchema,
  registrationInputSchema,
  teamCodeSchema,
} from "@/lib/schemas";
import { generateTeamCode } from "@/lib/team-code";
import { NetworkError } from "./errors";
import type { StoreState, Store } from "./store";
import type {
  ActorType,
  AdminActor,
  AuditEntry,
  Conflict,
  DataError,
  EmailTemplate,
  ErrorCode,
  FieldIssue,
  OutboxEmail,
  Result,
  Settings,
  ShortlistFinalisation,
  ShortlistState,
  Submission,
  Team,
  TeamDetail,
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
      if (!parsed.success) {
        const issues: FieldIssue[] = parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }));
        return fail("invalid_input", "Some details need fixing.", { issues });
      }
      const data = parsed.data;

      // One team per person: email and NIC are unique across all teams
      const s = store.state;
      const emails = new Set(s.members.map((m) => m.email));
      const nics = new Set(s.members.map((m) => m.nic).filter((n): n is string => n !== null));
      const conflicts: Conflict[] = [];
      for (const m of data.members) {
        if (emails.has(m.email)) conflicts.push({ field: "email", memberPosition: m.position });
        if (m.nic && nics.has(m.nic)) conflicts.push({ field: "nic", memberPosition: m.position });
      }
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

    async uploadProposal(upload: ProposalUpload): Promise<Result<{ version: number }>> {
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
              // A team that already sent a prototype stays at that stage
              if (t.stage !== "prototype_submitted") t.stage = "shortlisted";
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
      if (store.state.settings.shortlistState !== "finalised") {
        return fail("shortlist_not_finalised", "The shortlist isn't finalised.");
      }
      store.mutate((state) => {
        state.settings.shortlistState = "draft";
        record(state, { type: "admin", id: actor.id }, "shortlist.reopened", { type: "setting", id: "shortlist_state" });
      });
      return ok(null);
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

    async getAuditLog(filter: { targetType?: string; targetId?: string; limit?: number } = {}): Promise<AuditEntry[]> {
      await delay();
      const list = store.state.audit
        .filter((e) => !filter.targetType || e.targetType === filter.targetType)
        .filter((e) => !filter.targetId || e.targetId === filter.targetId)
        .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
      return clone(filter.limit ? list.slice(0, filter.limit) : list);
    },
  };
}

export type Data = ReturnType<typeof createData>;
