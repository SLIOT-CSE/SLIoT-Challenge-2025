import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import type {
  ActorType,
  Admin,
  AdminAccount,
  AdminRole,
  AuditEntry,
  Conflict,
  DataError,
  EmailTemplate,
  ErrorCode,
  FieldIssue,
  Member,
  Result,
  ShortlistState,
  Submission,
  Team,
  TeamDetail,
  TeamRow,
} from "@/lib/data/types";
import { readSession, SESSION_COOKIE } from "../auth/sessions";
import type { Db } from "../db/client";
import * as schema from "../db/schema";
import { readShortlistState } from "../settings";
import { realNow, type RequestContext } from "./context";

// Helpers shared by the team and admin halves of the backend.

export type Tx = Pick<Db, "select" | "selectDistinct" | "insert" | "update" | "delete">;

export const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
export const fail = (code: ErrorCode, message: string, extra: Partial<DataError> = {}): Result<never> => ({
  ok: false,
  error: { code, message, ...extra },
});

export const toIssues = (error: { issues: { path: PropertyKey[]; message: string }[] }): FieldIssue[] =>
  error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

/** Failed team logins, code reminders and organizer logins allowed per IP per window (architecture 6.2) */
export const RATE_LIMIT = { attempts: 5, windowMs: 15 * 60 * 1000 };

/** Registrations per IP: looser, since a whole school lab can register from one address */
export const REGISTRATION_LIMIT = { attempts: 20, windowMs: 60 * 60 * 1000 };

export const BEFORE_DECISION: Team["stage"][] = ["registered", "proposal_submitted"];
export const SHORTLISTED: Team["stage"][] = ["shortlisted", "prototype_submitted"];

// ---- Audit log and outbox ----

export interface Actor {
  type: ActorType;
  id: number | null;
}

export function record(
  tx: Tx,
  ctx: RequestContext,
  now: number,
  actor: Actor,
  action: string,
  target?: { type: string; id: string | number },
  details?: Record<string, unknown>,
): void {
  tx.insert(schema.auditLog)
    .values({
      actorType: actor.type,
      actorId: actor.id,
      action,
      targetType: target?.type ?? null,
      targetId: target ? String(target.id) : null,
      details: details ?? null,
      ip: ctx.ip,
      createdAt: now,
    })
    .run();
}

/** Writes an email for the background worker to send (docs/architecture.md, section 7) */
export function queueEmail(
  tx: Tx,
  now: number,
  teamId: number | null,
  toEmail: string,
  template: EmailTemplate,
  props: Record<string, string>,
): void {
  tx.insert(schema.emailOutbox)
    // Due at once: the worker schedules by real time, so the dev clock never holds an email back
    .values({ teamId, toEmail, template, props, status: "pending", attempts: 0, nextAttemptAt: 0, createdAt: now })
    .run();
}

/**
 * Seconds until another try is allowed for an anonymous action from this IP, or null while
 * under the limit. Counts the action's audit entries, so the limit survives restarts.
 */
export function retryAfterSeconds(
  tx: Tx,
  action: string,
  ip: string | null,
  now: number,
  limit: { attempts: number; windowMs: number } = RATE_LIMIT,
): number | null {
  const recent = tx
    .select({ createdAt: schema.auditLog.createdAt })
    .from(schema.auditLog)
    .where(
      and(
        eq(schema.auditLog.action, action),
        eq(schema.auditLog.actorType, "anonymous"),
        gt(schema.auditLog.createdAt, now - limit.windowMs),
        ...(ip ? [eq(schema.auditLog.ip, ip)] : []),
      ),
    )
    .orderBy(asc(schema.auditLog.createdAt))
    .all();
  if (recent.length < limit.attempts) return null;
  // A slot frees when the oldest of the counted attempts ages out
  const oldest = recent[recent.length - limit.attempts];
  return Math.max(1, Math.ceil((oldest.createdAt + limit.windowMs - now) / 1000));
}

export const rateLimited = (seconds: number) =>
  fail("rate_limited", "Too many tries. Please wait before trying again.", { retryAfterSeconds: seconds });

// ---- Rows to the shapes the screens use ----

type SubmissionRecord = typeof schema.submissions.$inferSelect;

export function toSubmission(s: SubmissionRecord): Submission {
  return {
    id: s.id,
    teamId: s.teamId,
    kind: s.kind,
    version: s.version,
    isCurrent: s.isCurrent,
    submittedAt: s.submittedAt,
    fileName: s.fileName,
    sizeBytes: s.sizeBytes,
    driveUrl: s.driveUrl,
    youtubeId: s.youtubeId,
    youtubeUrl: s.youtubeUrl,
  };
}

/** Who is looking: draft shortlist ticks are only shown to super admins */
export type Viewer = "super_admin" | "admin" | "team";

/** Hides draft ticks from everyone but super admins, as the architecture asks (6.6) */
export function maskTeam(team: Team, viewer: Viewer, shortlistState: ShortlistState): Team {
  if (viewer === "super_admin" || shortlistState === "finalised") return team;
  return { ...team, shortlistMark: false };
}

/** Teams with their members and current submissions, two queries for any number of teams */
export function teamRows(tx: Tx, teams: Team[], viewer: Viewer): TeamRow[] {
  if (teams.length === 0) return [];
  const ids = teams.map((t) => t.id);
  const members = tx
    .select()
    .from(schema.members)
    .where(inArray(schema.members.teamId, ids))
    .orderBy(asc(schema.members.teamId), asc(schema.members.position))
    .all() as Member[];
  const current = tx
    .select()
    .from(schema.submissions)
    .where(and(inArray(schema.submissions.teamId, ids), eq(schema.submissions.isCurrent, true)))
    .all();
  const shortlistState = readShortlistState(tx);

  const membersByTeam = new Map<number, Member[]>();
  for (const m of members) membersByTeam.set(m.teamId, [...(membersByTeam.get(m.teamId) ?? []), m]);

  return teams.map((team) => {
    const own = current.filter((s) => s.teamId === team.id);
    const pick = (kind: Submission["kind"]) => {
      const found = own.find((s) => s.kind === kind);
      return found ? toSubmission(found) : null;
    };
    return {
      ...maskTeam(team, viewer, shortlistState),
      members: membersByTeam.get(team.id) ?? [],
      proposal: pick("proposal"),
      prototype: pick("prototype"),
    };
  });
}

export function teamDetail(tx: Tx, team: Team, viewer: Viewer): TeamDetail {
  const [row] = teamRows(tx, [team], viewer);
  const submissions = tx
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.teamId, team.id))
    .orderBy(desc(schema.submissions.submittedAt), desc(schema.submissions.id))
    .all()
    .map(toSubmission);
  return { ...row, submissions };
}

export function findTeam(tx: Tx, teamId: number): Team | null {
  return (tx.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get() as Team | undefined) ?? null;
}

export function leaderOf(tx: Tx, teamId: number): Member | null {
  return (
    (tx
      .select()
      .from(schema.members)
      .where(and(eq(schema.members.teamId, teamId), eq(schema.members.position, 1)))
      .get() as Member | undefined) ?? null
  );
}

// ---- Who is calling ----

export function currentTeam(ctx: RequestContext): Team | null {
  const teamId = readSession(ctx.db, "team", ctx.cookies.get(SESSION_COOKIE.team), realNow(ctx));
  return teamId === null ? null : findTeam(ctx.db, teamId);
}

export function currentAdmin(ctx: RequestContext): Admin | null {
  const adminId = readSession(ctx.db, "admin", ctx.cookies.get(SESSION_COOKIE.admin), realNow(ctx));
  if (adminId === null) return null;
  const admin = ctx.db.select().from(schema.admins).where(eq(schema.admins.id, adminId)).get() as Admin | undefined;
  return admin && !admin.disabled ? admin : null;
}

/**
 * The check every organizer function starts with. The organizer comes from the session cookie,
 * never from what the browser sends, and super-admin functions need the super_admin role.
 */
export function authorise(ctx: RequestContext, role: AdminRole | "any"): Result<Admin> {
  const admin = currentAdmin(ctx);
  if (!admin) return fail("forbidden", "You need to be signed in as an organizer.");
  if (role === "super_admin" && admin.role !== "super_admin") return fail("forbidden", "Only super admins can do this.");
  return ok(admin);
}

export const toAccount = (a: Admin): AdminAccount => ({
  id: a.id,
  username: a.username,
  displayName: a.displayName,
  role: a.role,
  disabled: a.disabled,
  lastLoginAt: a.lastLoginAt,
  createdAt: a.createdAt,
});

/** Another team already uses an email or NIC (one team per person) */
export function memberConflicts(
  tx: Tx,
  members: { position: number; email: string; nic: string | null }[],
  exceptTeamId?: number,
): Conflict[] {
  const emails = members.map((m) => m.email);
  const nics = members.map((m) => m.nic).filter((n): n is string => n !== null);
  const taken = tx
    .select({ teamId: schema.members.teamId, email: schema.members.email, nic: schema.members.nic })
    .from(schema.members)
    .where(inArray(schema.members.email, emails))
    .all()
    .concat(
      nics.length
        ? tx
            .select({ teamId: schema.members.teamId, email: schema.members.email, nic: schema.members.nic })
            .from(schema.members)
            .where(inArray(schema.members.nic, nics))
            .all()
        : [],
    )
    .filter((m) => m.teamId !== exceptTeamId);
  const takenEmails = new Set(taken.map((m) => m.email));
  const takenNics = new Set(taken.map((m) => m.nic).filter(Boolean));
  const conflicts: Conflict[] = [];
  for (const m of members) {
    if (takenEmails.has(m.email)) conflicts.push({ field: "email", memberPosition: m.position });
    if (m.nic && takenNics.has(m.nic)) conflicts.push({ field: "nic", memberPosition: m.position });
  }
  return conflicts;
}

/** A unique-index failure from SQLite: two requests registered the same person at the same moment */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/.test(error.message);
}

export function auditView(tx: Tx, entries: AuditEntry[]) {
  const adminIds = [...new Set(entries.filter((e) => e.actorType === "admin" && e.actorId !== null).map((e) => e.actorId!))];
  const teamIds = [...new Set(entries.filter((e) => e.actorType === "team" && e.actorId !== null).map((e) => e.actorId!))];
  const adminNames = new Map(
    (adminIds.length
      ? tx.select({ id: schema.admins.id, name: schema.admins.displayName }).from(schema.admins).where(inArray(schema.admins.id, adminIds)).all()
      : []
    ).map((a) => [a.id, a.name]),
  );
  const teamNames = new Map(
    (teamIds.length
      ? tx.select({ id: schema.teams.id, name: schema.teams.name }).from(schema.teams).where(inArray(schema.teams.id, teamIds)).all()
      : []
    ).map((t) => [t.id, t.name]),
  );
  return entries.map((e) => ({
    ...e,
    actorName:
      e.actorType === "admin"
        ? (adminNames.get(e.actorId!) ?? null)
        : e.actorType === "team"
          ? (teamNames.get(e.actorId!) ?? null)
          : e.actorType === "system"
            ? "System"
            : null,
  }));
}
