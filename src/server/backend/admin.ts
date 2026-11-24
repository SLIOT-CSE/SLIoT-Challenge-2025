import { and, asc, desc, eq, gte, inArray, lte, ne, type SQL } from "drizzle-orm";
import { generatePassword } from "@/lib/admin-password";
import { AUDIT_ACTION_GROUPS, auditActionGroup } from "@/lib/data/audit";
import { buildTeamsCsv, buildTeamsTable, teamsCsvFileName } from "@/lib/data/csv";
import { deadlineSettingsSchema, newAdminSchema, registrationInputSchema } from "@/lib/schemas";
import type {
  Admin,
  AdminAccount,
  AdminActor,
  AdminRole,
  AuditEntry,
  AuditEntryView,
  AuditFilter,
  DeadlineSettings,
  FieldChange,
  NewAdminInput,
  OutboxEmail,
  Result,
  ShortlistFinalisation,
  Team,
  TeamDetail,
  TeamEditInput,
  TeamFilter,
  TeamRow,
} from "@/lib/data/types";
import { decoyHash, hashPassword, verifyPassword } from "../auth/passwords";
import { createSession, deleteSession, deleteSubjectSessions, SESSION_COOKIE, SESSION_TTL_MS } from "../auth/sessions";
import * as schema from "../db/schema";
import { readDeadlines, readShortlistState, SETTING_KEYS, writeDeadlines, writeSetting } from "../settings";
import {
  auditView,
  authorise,
  currentAdmin,
  fail,
  findTeam,
  isUniqueViolation,
  leaderOf,
  memberConflicts,
  ok,
  queueEmail,
  rateLimited,
  record,
  retryAfterSeconds,
  teamDetail,
  teamRows,
  toAccount,
  toIssues,
  type Tx,
  type Viewer,
} from "./common";
import { nowFor, realNow, type RequestContext } from "./context";

// The organizer side: sign in, teams, shortlist, finalists, exports, settings, accounts and the
// audit log. Every function finds the organizer from the session cookie. The `actor` argument
// the screens still pass is ignored: the browser never decides who it is.

const SUPER = "super_admin" as const;

/** Audit entries plain admins don't see: draft shortlist ticks (architecture 6.6) */
const SUPER_ONLY_ACTIONS = ["shortlist.marked"];

export function adminBackend(ctx: RequestContext) {
  const now = () => nowFor(ctx);
  const viewer = (admin: Admin): Viewer => (admin.role === "super_admin" ? "super_admin" : "admin");
  const by = (admin: Admin) => ({ type: "admin" as const, id: admin.id });

  const activeSuperAdmins = (tx: Tx) =>
    tx
      .select({ id: schema.admins.id })
      .from(schema.admins)
      .where(and(eq(schema.admins.role, "super_admin"), eq(schema.admins.disabled, false)))
      .all();

  const teamsByIds = (tx: Tx, ids: number[]): (Team | undefined)[] => {
    const found = ids.length ? (tx.select().from(schema.teams).where(inArray(schema.teams.id, ids)).all() as Team[]) : [];
    return ids.map((id) => found.find((t) => t.id === id));
  };

  const teamsWith = (tx: Tx, ids: number[], kind: "proposal" | "prototype") =>
    new Set(
      ids.length
        ? tx
            .selectDistinct({ teamId: schema.submissions.teamId })
            .from(schema.submissions)
            .where(and(inArray(schema.submissions.teamId, ids), eq(schema.submissions.kind, kind)))
            .all()
            .map((r) => r.teamId)
        : [],
    );

  return {
    // ---- Sign in ----

    async adminLogin(username: string, password: string): Promise<Result<{ admin: AdminAccount }>> {
      const at = now();
      const wait = retryAfterSeconds(ctx.db, "admin.login_failed", ctx.ip, at);
      if (wait !== null) return rateLimited(wait);

      const name = username.trim().toLowerCase();
      const admin = ctx.db.select().from(schema.admins).where(eq(schema.admins.username, name)).get() as Admin | undefined;
      // Always verify a hash, so an unknown username takes as long as a wrong password
      const matches = await verifyPassword(admin?.passwordHash ?? (await decoyHash()), password);
      // A disabled account gets the same reply as a wrong password, so it can't be told apart
      if (!admin || admin.disabled || !matches) {
        record(ctx.db, ctx, at, { type: "anonymous", id: null }, "admin.login_failed", undefined, { username: name.slice(0, 60) });
        return fail("invalid_credentials", "Wrong username or password.");
      }

      const session = ctx.db.transaction((tx) => {
        tx.update(schema.admins).set({ lastLoginAt: at }).where(eq(schema.admins.id, admin.id)).run();
        const s = createSession(tx, "admin", admin.id, realNow(ctx), { ip: ctx.ip, userAgent: ctx.userAgent });
        record(tx, ctx, at, by(admin), "admin.login", { type: "admin", id: admin.id });
        return s;
      });
      ctx.cookies.set(SESSION_COOKIE.admin, session.token, SESSION_TTL_MS.admin / 1000);
      return ok({ admin: toAccount({ ...admin, lastLoginAt: at }) });
    },

    async adminLogout(): Promise<void> {
      deleteSession(ctx.db, ctx.cookies.get(SESSION_COOKIE.admin));
      ctx.cookies.delete(SESSION_COOKIE.admin);
    },

    /** The organizer who is signed in, or null (also null once the account is disabled) */
    async getCurrentAdmin(): Promise<AdminAccount | null> {
      const admin = currentAdmin(ctx);
      return admin ? toAccount(admin) : null;
    },

    // ---- Reading teams ----

    async getTeam(teamId: number): Promise<TeamDetail | null> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return null;
      const team = findTeam(ctx.db, teamId);
      return team ? teamDetail(ctx.db, team, viewer(auth.data)) : null;
    },

    async listTeams(filter: TeamFilter = {}): Promise<TeamRow[]> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return [];
      const where: SQL[] = [];
      if (filter.category) where.push(eq(schema.teams.category, filter.category));
      if (filter.stage) where.push(eq(schema.teams.stage, filter.stage));
      const teams = ctx.db
        .select()
        .from(schema.teams)
        .where(where.length ? and(...where) : undefined)
        .orderBy(asc(schema.teams.id))
        .all() as Team[];
      const rows = teamRows(ctx.db, teams, viewer(auth.data));
      const needle = filter.search?.trim().toLowerCase();
      if (!needle) return rows;
      return rows.filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          r.code.toLowerCase().includes(needle) ||
          r.members.some(
            (m) => m.fullName.toLowerCase().includes(needle) || m.email.includes(needle) || (m.nic?.toLowerCase().includes(needle) ?? false),
          ),
      );
    },

    // ---- Shortlisting (super admins) ----

    /** Draft ticks. Only teams with a proposal can be ticked, and only while the list is a draft */
    async setShortlistMarks(teamIds: number[], marked: boolean, _actor?: AdminActor): Promise<Result<{ count: number }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      if (readShortlistState(ctx.db) === "finalised") {
        return fail("shortlist_finalised", "The shortlist is finalised. Reopen it to change the ticks.");
      }
      const teams = teamsByIds(ctx.db, teamIds);
      if (teams.some((t) => !t)) return fail("not_allowed", "One of those teams doesn't exist.");
      const withProposal = teamsWith(ctx.db, teamIds, "proposal");
      const missing = (teams as Team[]).filter((t) => !withProposal.has(t.id));
      if (missing.length > 0) return fail("no_proposal", `${missing.map((t) => t.name).join(", ")} hasn't submitted a proposal.`);

      const at = now();
      return ok(
        ctx.db.transaction((tx) => {
          const changed = (teams as Team[]).filter((t) => t.shortlistMark !== marked).map((t) => t.id);
          if (changed.length) {
            tx.update(schema.teams).set({ shortlistMark: marked, updatedAt: at }).where(inArray(schema.teams.id, changed)).run();
          }
          record(tx, ctx, at, by(auth.data), "shortlist.marked", { type: "team", id: teamIds.join(",") }, { marked, count: changed.length });
          return { count: changed.length };
        }),
      );
    },

    /** Publishes the ticks in one transaction. Needs the word FINALISE, as the dialog asks for it */
    async finaliseShortlist(
      _actor: AdminActor | undefined,
      confirmation: string,
    ): Promise<Result<{ shortlistedCount: number; newlyEmailedCount: number; finalisationId: number }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      if (confirmation !== "FINALISE") return fail("confirmation_required", "Type FINALISE to confirm.");

      const at = now();
      return ctx.db.transaction((tx) => {
        // Checked inside the transaction, so two super admins pressing Finalise together can't both run it
        if (readShortlistState(tx) === "finalised") return fail("shortlist_finalised", "The shortlist is already finalised.");

        const teams = tx.select().from(schema.teams).orderBy(asc(schema.teams.id)).all() as Team[];
        let newlyEmailedCount = 0;
        const shortlistedIds: number[] = [];
        for (const t of teams) {
          if (t.shortlistMark) {
            shortlistedIds.push(t.id);
            // A team that already sent a prototype, or is a finalist, stays at that stage
            const stage = t.stage === "prototype_submitted" || t.stage === "finalist" ? t.stage : "shortlisted";
            let emailedAt = t.shortlistEmailedAt;
            if (emailedAt === null) {
              queueEmail(tx, at, t.id, leaderOf(tx, t.id)!.email, "shortlisted", { teamName: t.name });
              emailedAt = at;
              newlyEmailedCount++;
            }
            tx.update(schema.teams).set({ stage, shortlistEmailedAt: emailedAt, updatedAt: at }).where(eq(schema.teams.id, t.id)).run();
          } else {
            // Teams that weren't shortlisted are told in their portal, not by email
            tx.update(schema.teams).set({ stage: "not_shortlisted", updatedAt: at }).where(eq(schema.teams.id, t.id)).run();
          }
        }

        writeSetting(tx, SETTING_KEYS.shortlistState, "finalised", auth.data.id, at);
        const finalisation = tx
          .insert(schema.shortlistFinalisations)
          .values({ finalisedBy: auth.data.id, finalisedAt: at, shortlistedCount: shortlistedIds.length, newlyEmailedCount, teamIds: shortlistedIds })
          .returning({ id: schema.shortlistFinalisations.id })
          .get();
        record(tx, ctx, at, by(auth.data), "shortlist.finalised", { type: "setting", id: "shortlist_state" }, {
          shortlistedCount: shortlistedIds.length,
          newlyEmailedCount,
        });
        return ok({ shortlistedCount: shortlistedIds.length, newlyEmailedCount, finalisationId: finalisation.id });
      });
    },

    /** Back to draft. Teams keep their published result until the next finalise */
    async reopenShortlist(_actor?: AdminActor): Promise<Result<null>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const at = now();
      return ctx.db.transaction((tx) => {
        if (readShortlistState(tx) !== "finalised") return fail("shortlist_not_finalised", "The shortlist isn't finalised.");
        // The shortlist is decided once, before prototypes: locked as soon as one prototype exists
        const anyPrototype = tx.select({ id: schema.submissions.id }).from(schema.submissions).where(eq(schema.submissions.kind, "prototype")).get();
        if (anyPrototype) return fail("not_allowed", "Teams have submitted prototypes, so the shortlist can no longer be reopened.");
        writeSetting(tx, SETTING_KEYS.shortlistState, "draft", auth.data.id, at);
        record(tx, ctx, at, by(auth.data), "shortlist.reopened", { type: "setting", id: "shortlist_state" });
        return ok(null);
      });
    },

    async listShortlistFinalisations(): Promise<ShortlistFinalisation[]> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return [];
      return ctx.db
        .select({
          id: schema.shortlistFinalisations.id,
          finalisedBy: schema.shortlistFinalisations.finalisedBy,
          finalisedByName: schema.admins.displayName,
          finalisedAt: schema.shortlistFinalisations.finalisedAt,
          shortlistedCount: schema.shortlistFinalisations.shortlistedCount,
          newlyEmailedCount: schema.shortlistFinalisations.newlyEmailedCount,
          teamIds: schema.shortlistFinalisations.teamIds,
        })
        .from(schema.shortlistFinalisations)
        .innerJoin(schema.admins, eq(schema.admins.id, schema.shortlistFinalisations.finalisedBy))
        .orderBy(desc(schema.shortlistFinalisations.id))
        .all();
    },

    // ---- Finalists (super admins) ----

    /** Makes teams finalists. Needs the word FINALISTS; only teams with a prototype; each leader emailed once */
    async announceFinalists(
      teamIds: number[],
      _actor: AdminActor | undefined,
      confirmation: string,
    ): Promise<Result<{ count: number; newlyEmailedCount: number }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      if (confirmation !== "FINALISTS") return fail("confirmation_required", "Type FINALISTS to confirm.");
      const teams = teamsByIds(ctx.db, teamIds);
      if (teams.some((t) => !t)) return fail("not_allowed", "One of those teams doesn't exist.");
      const withPrototype = teamsWith(ctx.db, teamIds, "prototype");
      const missing = (teams as Team[]).filter((t) => !withPrototype.has(t.id));
      if (missing.length > 0) return fail("no_prototype", `${missing.map((t) => t.name).join(", ")} hasn't submitted a prototype.`);

      const at = now();
      return ok(
        ctx.db.transaction((tx) => {
          let count = 0;
          let newlyEmailedCount = 0;
          for (const t of teams as Team[]) {
            if (t.stage === "finalist") continue;
            count++;
            let emailedAt = t.finalistEmailedAt;
            if (emailedAt === null) {
              queueEmail(tx, at, t.id, leaderOf(tx, t.id)!.email, "finalist", { teamName: t.name });
              emailedAt = at;
              newlyEmailedCount++;
            }
            tx.update(schema.teams).set({ stage: "finalist", finalistEmailedAt: emailedAt, updatedAt: at }).where(eq(schema.teams.id, t.id)).run();
          }
          record(tx, ctx, at, by(auth.data), "finalists.announced", { type: "team", id: teamIds.join(",") }, { count, newlyEmailedCount });
          return { count, newlyEmailedCount };
        }),
      );
    },

    /** Corrects a mistake: finalists go back to prototype_submitted. No email is sent */
    async unmarkFinalists(teamIds: number[], _actor?: AdminActor): Promise<Result<{ count: number }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const teams = teamsByIds(ctx.db, teamIds);
      if (teams.some((t) => !t || t.stage !== "finalist")) return fail("not_allowed", "Only finalists can be taken off the finalists list.");
      const at = now();
      return ok(
        ctx.db.transaction((tx) => {
          tx.update(schema.teams).set({ stage: "prototype_submitted", updatedAt: at }).where(inArray(schema.teams.id, teamIds)).run();
          record(tx, ctx, at, by(auth.data), "finalists.unmarked", { type: "team", id: teamIds.join(",") }, { count: teamIds.length });
          return { count: teamIds.length };
        }),
      );
    },

    // ---- Records ----

    /** Emails the app queued or sent, newest first */
    async listOutbox(teamId?: number): Promise<OutboxEmail[]> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return [];
      return ctx.db
        .select({
          id: schema.emailOutbox.id,
          teamId: schema.emailOutbox.teamId,
          toEmail: schema.emailOutbox.toEmail,
          template: schema.emailOutbox.template,
          props: schema.emailOutbox.props,
          status: schema.emailOutbox.status,
          attempts: schema.emailOutbox.attempts,
          lastError: schema.emailOutbox.lastError,
          createdAt: schema.emailOutbox.createdAt,
          sentAt: schema.emailOutbox.sentAt,
        })
        .from(schema.emailOutbox)
        .where(teamId === undefined ? undefined : eq(schema.emailOutbox.teamId, teamId))
        .orderBy(desc(schema.emailOutbox.createdAt), desc(schema.emailOutbox.id))
        .all();
    },

    /** The trail for one target (the team drawer). Draft ticks are hidden from plain admins */
    async getAuditLog(filter: { targetType?: string; targetId?: string; limit?: number } = {}): Promise<AuditEntryView[]> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return [];
      const where: SQL[] = [];
      if (filter.targetType) where.push(eq(schema.auditLog.targetType, filter.targetType));
      if (filter.targetId) where.push(eq(schema.auditLog.targetId, filter.targetId));
      if (auth.data.role !== "super_admin") for (const action of SUPER_ONLY_ACTIONS) where.push(ne(schema.auditLog.action, action));
      const query = ctx.db
        .select()
        .from(schema.auditLog)
        .where(where.length ? and(...where) : undefined)
        .orderBy(desc(schema.auditLog.createdAt), desc(schema.auditLog.id));
      const entries = (filter.limit ? query.limit(filter.limit).all() : query.all()) as AuditEntry[];
      return auditView(ctx.db, entries);
    },

    // ---- Editing teams ----

    /**
     * Fixes typos in a team: its name, institution and each member's details. Not the code,
     * category, stage or number of members. Runs the registration rules, including one team per
     * person. `expectedUpdatedAt`, when sent, refuses the edit if someone else saved first.
     */
    async updateTeam(
      teamId: number,
      edit: TeamEditInput & { expectedUpdatedAt?: number },
      _actor?: AdminActor,
    ): Promise<Result<{ changes: FieldChange[] }>> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return auth;
      const team = findTeam(ctx.db, teamId);
      if (!team) return fail("not_found", "That team doesn't exist.");
      if (edit.expectedUpdatedAt !== undefined && edit.expectedUpdatedAt !== team.updatedAt) {
        return fail("edit_conflict", "Someone else changed this team while you were editing. Close and open it again to see their changes.");
      }
      const current = teamDetail(ctx.db, team, viewer(auth.data)).members;
      if (edit.members.length !== current.length) return fail("invalid_input", "Members can't be added or removed here.");

      const parsed = registrationInputSchema.safeParse({
        name: edit.name,
        category: team.category,
        institutionName: edit.institutionName,
        institutionIsOther: edit.institutionIsOther,
        members: edit.members,
      });
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;

      const conflicts = memberConflicts(ctx.db, data.members, teamId);
      if (conflicts.length > 0) return fail("duplicate_member", "Someone in this team is already registered in another team.", { conflicts });

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
        // In School and University teams a member's institution follows the team's
        if (team.category === "open") {
          diff(`${at}.institutionType`, m.institutionType, next.institutionType);
          diff(`${at}.institutionName`, m.institutionName, next.institutionName);
          diff(`${at}.institutionIsOther`, yesNo(m.institutionIsOther), yesNo(next.institutionIsOther));
        }
      });
      if (changes.length === 0) return ok({ changes });

      const at = now();
      try {
        return ok(
          ctx.db.transaction((tx) => {
            tx.update(schema.teams)
              .set({ name: data.name, institutionName: data.institutionName, institutionIsOther: data.institutionIsOther, updatedAt: at })
              .where(eq(schema.teams.id, teamId))
              .run();
            // Two passes, so swapping emails between two members of the team doesn't trip the unique index
            for (const m of current) {
              tx.update(schema.members).set({ email: `swap-${m.id}@invalid`, nic: null }).where(eq(schema.members.id, m.id)).run();
            }
            current.forEach((m, i) => {
              const next = data.members[i];
              tx.update(schema.members)
                .set({
                  fullName: next.fullName,
                  whatsapp: next.whatsapp,
                  email: next.email,
                  nic: next.nic,
                  institutionType: next.institutionType,
                  institutionName: next.institutionName,
                  institutionIsOther: next.institutionIsOther,
                })
                .where(eq(schema.members.id, m.id))
                .run();
            });
            record(tx, ctx, at, by(auth.data), "team.edited", { type: "team", id: teamId }, { changes });
            return { changes };
          }),
        );
      } catch (error) {
        if (isUniqueViolation(error)) {
          return fail("duplicate_member", "Someone in this team is already registered in another team.", {
            conflicts: memberConflicts(ctx.db, data.members, teamId),
          });
        }
        throw error;
      }
    },

    /** Emails the team code to the leader again */
    async resendCode(teamId: number, _actor?: AdminActor): Promise<Result<{ toEmail: string }>> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return auth;
      const team = findTeam(ctx.db, teamId);
      const leader = team && leaderOf(ctx.db, teamId);
      if (!team || !leader) return fail("not_found", "That team doesn't exist.");
      const at = now();
      ctx.db.transaction((tx) => {
        queueEmail(tx, at, team.id, leader.email, "code_reminder", { code: team.code, teamName: team.name });
        record(tx, ctx, at, by(auth.data), "team.code_resent", { type: "team", id: team.id });
      });
      return ok({ toEmail: leader.email });
    },

    // ---- Exports ----

    /** The teams as CSV, in the order of `teamIds` (the table's current view), or every team */
    async exportTeamsCsv(
      teamIds: number[] | undefined,
      _actor?: AdminActor,
    ): Promise<Result<{ csv: string; fileName: string; count: number }>> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return auth;
      const teams = teamIds ? teamsByIds(ctx.db, teamIds) : (ctx.db.select().from(schema.teams).orderBy(asc(schema.teams.id)).all() as Team[]);
      if (teams.some((t) => !t)) return fail("not_found", "One of those teams doesn't exist.");
      const rows = teamRows(ctx.db, teams as Team[], viewer(auth.data));
      const at = now();
      record(ctx.db, ctx, at, by(auth.data), "export.csv", undefined, { count: rows.length });
      return ok({ csv: buildTeamsCsv(rows, { shortlistState: readShortlistState(ctx.db) }), fileName: teamsCsvFileName(at), count: rows.length });
    },

    /** Rewrites the Teams tab of the master Google Sheet from the database (one way only) */
    async exportToSheets(_actor?: AdminActor): Promise<Result<{ exportedAt: number; count: number }>> {
      const auth = authorise(ctx, "any");
      if (!auth.ok) return auth;
      const sheets = ctx.services.sheets();
      if (!sheets.ok) {
        console.error(`Sheets export refused: not set up (missing ${sheets.missing.join(", ")})`);
        return fail("not_configured", "The Google Sheets export isn't set up yet. Download the CSV instead.");
      }
      const teams = ctx.db.select().from(schema.teams).orderBy(asc(schema.teams.id)).all() as Team[];
      const rows = buildTeamsTable(teamRows(ctx.db, teams, viewer(auth.data)), { shortlistState: readShortlistState(ctx.db) });
      try {
        await sheets.service.replaceTeamsTab(rows);
      } catch (error) {
        console.error("Sheets export failed", error);
        return fail("upload_failed", "Google Sheets didn't accept the export. Please try again.");
      }
      const at = now();
      ctx.db.transaction((tx) => {
        writeSetting(tx, SETTING_KEYS.lastSheetExportAt, at, auth.data.id, at);
        record(tx, ctx, at, by(auth.data), "export.sheets", undefined, { count: teams.length });
      });
      return ok({ exportedAt: at, count: teams.length });
    },

    // ---- Settings, accounts and the audit log (super admins) ----

    /** Changes deadlines. Keeps registration, proposal and prototype in that order */
    async updateSettings(patch: Partial<DeadlineSettings>, _actor?: AdminActor): Promise<Result<DeadlineSettings>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const { registrationCloses, proposalDue, prototypeDue } = readDeadlines(ctx.db);
      const before: DeadlineSettings = { registrationCloses, proposalDue, prototypeDue };
      const next: DeadlineSettings = { ...before, ...patch };
      const parsed = deadlineSettingsSchema.safeParse(next);
      if (!parsed.success) return fail("invalid_input", "Some deadlines need fixing.", { issues: toIssues(parsed.error) });

      const keys = ["registrationCloses", "proposalDue", "prototypeDue"] as const;
      const changes: FieldChange[] = keys
        .filter((k) => Date.parse(before[k]) !== Date.parse(next[k]))
        .map((k) => ({ field: k, from: before[k], to: next[k] }));
      if (changes.length === 0) return ok(before);

      const at = now();
      ctx.db.transaction((tx) => {
        writeDeadlines(tx, next, auth.data.id, at);
        record(tx, ctx, at, by(auth.data), "settings.updated", { type: "setting", id: "deadlines" }, { changes });
      });
      const saved = readDeadlines(ctx.db);
      return ok({ registrationCloses: saved.registrationCloses, proposalDue: saved.proposalDue, prototypeDue: saved.prototypeDue });
    },

    async listAdmins(_actor?: AdminActor): Promise<Result<AdminAccount[]>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      return ok((ctx.db.select().from(schema.admins).orderBy(asc(schema.admins.id)).all() as Admin[]).map(toAccount));
    },

    /** Makes an account with a generated password. The password is returned once and never stored */
    async createAdmin(input: NewAdminInput, _actor?: AdminActor): Promise<Result<{ admin: AdminAccount; password: string }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const parsed = newAdminSchema.safeParse(input);
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;
      const taken = () =>
        fail("duplicate_username", "That username is taken. Choose another.", {
          issues: [{ path: "username", message: "That username is taken. Choose another." }],
        });
      if (ctx.db.select({ id: schema.admins.id }).from(schema.admins).where(eq(schema.admins.username, data.username)).get()) return taken();

      const password = generatePassword();
      const passwordHash = await hashPassword(password);
      const at = now();
      try {
        const admin = ctx.db.transaction((tx) => {
          const row = tx
            .insert(schema.admins)
            .values({ username: data.username, displayName: data.displayName, role: data.role, passwordHash, createdAt: at })
            .returning()
            .get() as Admin;
          record(tx, ctx, at, by(auth.data), "admin.created", { type: "admin", id: row.id }, { username: row.username, role: row.role });
          return row;
        });
        return ok({ admin: toAccount(admin), password });
      } catch (error) {
        if (isUniqueViolation(error)) return taken();
        throw error;
      }
    },

    /** New generated password. The old one stops working and the account's sessions end */
    async resetAdminPassword(adminId: number, _actor?: AdminActor): Promise<Result<{ password: string }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      if (!ctx.db.select({ id: schema.admins.id }).from(schema.admins).where(eq(schema.admins.id, adminId)).get()) {
        return fail("not_found", "That account doesn't exist.");
      }
      const password = generatePassword();
      const passwordHash = await hashPassword(password);
      const at = now();
      ctx.db.transaction((tx) => {
        tx.update(schema.admins).set({ passwordHash }).where(eq(schema.admins.id, adminId)).run();
        deleteSubjectSessions(tx, "admin", adminId);
        record(tx, ctx, at, by(auth.data), "admin.password_reset", { type: "admin", id: adminId });
      });
      return ok({ password });
    },

    /** Disabled accounts can't log in and their sessions end. Not yourself, and not the last super admin */
    async setAdminDisabled(adminId: number, disabled: boolean, _actor?: AdminActor): Promise<Result<AdminAccount>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const at = now();
      return ctx.db.transaction((tx) => {
        const target = tx.select().from(schema.admins).where(eq(schema.admins.id, adminId)).get() as Admin | undefined;
        if (!target) return fail("not_found", "That account doesn't exist.");
        if (disabled && !target.disabled) {
          if (target.id === auth.data.id) return fail("own_account", "You can't disable your own account.");
          if (target.role === "super_admin" && activeSuperAdmins(tx).length <= 1) {
            return fail("last_super_admin", "This is the last active super admin. Make another account a super admin first.");
          }
        }
        if (target.disabled === disabled) return ok(toAccount(target));
        tx.update(schema.admins).set({ disabled }).where(eq(schema.admins.id, adminId)).run();
        if (disabled) deleteSubjectSessions(tx, "admin", adminId);
        record(tx, ctx, at, by(auth.data), disabled ? "admin.disabled" : "admin.enabled", { type: "admin", id: adminId }, {
          username: target.username,
        });
        return ok(toAccount({ ...target, disabled }));
      });
    },

    /** Changes an account's role. The last active super admin can't be demoted */
    async setAdminRole(adminId: number, role: AdminRole, _actor?: AdminActor): Promise<Result<AdminAccount>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const at = now();
      return ctx.db.transaction((tx) => {
        const target = tx.select().from(schema.admins).where(eq(schema.admins.id, adminId)).get() as Admin | undefined;
        if (!target) return fail("not_found", "That account doesn't exist.");
        if (target.role === role) return ok(toAccount(target));
        if (role !== "super_admin" && target.role === "super_admin" && !target.disabled && activeSuperAdmins(tx).length <= 1) {
          return fail("last_super_admin", "This is the last active super admin. Make another account a super admin first.");
        }
        tx.update(schema.admins).set({ role }).where(eq(schema.admins.id, adminId)).run();
        record(tx, ctx, at, by(auth.data), "admin.role_changed", { type: "admin", id: adminId }, { from: target.role, to: role, username: target.username });
        return ok(toAccount({ ...target, role }));
      });
    },

    /** The whole audit log, newest first, a page at a time */
    async listAuditLog(
      _actor: AdminActor | undefined,
      filter: AuditFilter = {},
    ): Promise<Result<{ entries: AuditEntryView[]; hasMore: boolean }>> {
      const auth = authorise(ctx, SUPER);
      if (!auth.ok) return auth;
      const where: SQL[] = [];
      if (filter.actorType) where.push(eq(schema.auditLog.actorType, filter.actorType));
      if (filter.actorId !== undefined) where.push(eq(schema.auditLog.actorId, filter.actorId));
      if (filter.from !== undefined) where.push(gte(schema.auditLog.createdAt, filter.from));
      if (filter.to !== undefined) where.push(lte(schema.auditLog.createdAt, filter.to));
      let entries = ctx.db
        .select()
        .from(schema.auditLog)
        .where(where.length ? and(...where) : undefined)
        .orderBy(desc(schema.auditLog.createdAt), desc(schema.auditLog.id))
        .all() as AuditEntry[];
      // Groups come from the action's prefix; a few thousand rows, so filtered here
      if (filter.actionGroup && AUDIT_ACTION_GROUPS.includes(filter.actionGroup)) {
        entries = entries.filter((e) => auditActionGroup(e.action) === filter.actionGroup);
      }
      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? 100;
      return ok({ entries: auditView(ctx.db, entries.slice(offset, offset + limit)), hasMore: offset + limit < entries.length });
    },
  };
}
