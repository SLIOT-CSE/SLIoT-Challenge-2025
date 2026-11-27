import { createHash } from "node:crypto";
import { and, eq, max } from "drizzle-orm";
import { stageAt } from "@/lib/competition";
import { emailSchema, hasPdfHeader, prototypeLinkSchema, proposalFileSchema, registrationInputSchema, teamCodeSchema } from "@/lib/schemas";
import { generateTeamCode } from "@/lib/team-code";
import type { CompetitionState, Result, Settings, TeamDetail } from "@/lib/data/types";
import { createSession, deleteSession, SESSION_COOKIE, SESSION_TTL_MS } from "../auth/sessions";
import * as schema from "../db/schema";
import { readDeadlines, readSetting, readShortlistState, SETTING_KEYS } from "../settings";
import {
  codeReminderSentRecently,
  BEFORE_DECISION,
  REGISTRATION_LIMIT,
  SHORTLISTED,
  currentTeam,
  fail,
  isUniqueViolation,
  leaderOf,
  memberConflicts,
  ok,
  queueEmail,
  rateLimited,
  record,
  retryAfterSeconds,
  teamDetail,
  toIssues,
} from "./common";
import { nowFor, realNow, type RequestContext } from "./context";

// The public side: competition state, registration, team login and the team portal.

export interface RegistrationGuard {
  /** Cloudflare Turnstile token from the form */
  turnstileToken?: string;
  /** The hidden field bots fill in */
  honeypot?: string;
}

/** Checks a Turnstile token with Cloudflare. Injected so tests don't call out */
export type TurnstileVerifier = (token: string | undefined, ip: string | null) => Promise<boolean>;

export function teamBackend(ctx: RequestContext, verifyTurnstile: TurnstileVerifier) {
  const now = () => nowFor(ctx);
  const stageNow = () => stageAt(new Date(now()), readDeadlines(ctx.db));

  return {
    async getCompetitionState(): Promise<CompetitionState> {
      return { now: now(), stage: stageNow(), shortlistState: readShortlistState(ctx.db), deadlines: readDeadlines(ctx.db) };
    },

    async getSettings(): Promise<Settings> {
      return {
        shortlistState: readShortlistState(ctx.db),
        deadlines: readDeadlines(ctx.db),
        lastSheetExportAt: readSetting<number>(ctx.db, SETTING_KEYS.lastSheetExportAt),
      };
    },

    async registerTeam(input: unknown, guard: RegistrationGuard = {}): Promise<Result<{ teamId: number; code: string }>> {
      const stage = stageNow();
      if (stage === "before-registration") return fail("registration_not_open", "Registration hasn't opened yet.");
      if (stage !== "registration") return fail("registration_closed", "Registration has closed.");

      const at = now();
      const wait = retryAfterSeconds(ctx.db, "team.registered", ctx.ip, at, REGISTRATION_LIMIT);
      if (wait !== null) return rateLimited(wait);
      // A filled honeypot is a bot. The form already pretends it worked; refuse quietly
      if (guard.honeypot) return fail("invalid_input", "Some details need fixing.");
      if (!(await verifyTurnstile(guard.turnstileToken, ctx.ip))) {
        return fail("invalid_input", "The bot check didn't pass. Please try again.", {
          issues: [{ path: "turnstile", message: "The bot check didn't pass. Please try again." }],
        });
      }

      const parsed = registrationInputSchema.safeParse(input);
      if (!parsed.success) return fail("invalid_input", "Some details need fixing.", { issues: toIssues(parsed.error) });
      const data = parsed.data;

      const conflicts = memberConflicts(ctx.db, data.members);
      if (conflicts.length > 0) {
        return fail("duplicate_member", "Someone in this team is already registered in another team.", { conflicts });
      }

      try {
        return ok(
          ctx.db.transaction((tx) => {
            // About a trillion codes, so a clash is rare; the unique index is the final word
            let code = generateTeamCode();
            while (tx.select({ id: schema.teams.id }).from(schema.teams).where(eq(schema.teams.code, code)).get()) {
              code = generateTeamCode();
            }
            const team = tx
              .insert(schema.teams)
              .values({
                code,
                name: data.name,
                category: data.category,
                institutionName: data.institutionName,
                institutionIsOther: data.institutionIsOther,
                createdAt: at,
                updatedAt: at,
              })
              .returning({ id: schema.teams.id })
              .get();
            tx.insert(schema.members).values(data.members.map((m) => ({ teamId: team.id, ...m }))).run();
            queueEmail(tx, at, team.id, data.members[0].email, "registration_confirmed", {
              code,
              teamName: data.name,
              category: data.category,
            });
            record(tx, ctx, at, { type: "anonymous", id: null }, "team.registered", { type: "team", id: team.id }, { code });
            return { teamId: team.id, code };
          }),
        );
      } catch (error) {
        // Two forms with the same person submitted at the same moment: the index caught the second
        if (isUniqueViolation(error)) {
          const again = memberConflicts(ctx.db, data.members);
          return fail("duplicate_member", "Someone in this team is already registered in another team.", { conflicts: again });
        }
        throw error;
      }
    },

    async loginWithCode(code: string): Promise<Result<{ teamId: number }>> {
      const at = now();
      const wait = retryAfterSeconds(ctx.db, "team.login_failed", ctx.ip, at);
      if (wait !== null) return rateLimited(wait);

      const parsed = teamCodeSchema.safeParse(code);
      const team = parsed.success
        ? ctx.db.select().from(schema.teams).where(eq(schema.teams.code, parsed.data)).get()
        : undefined;
      if (!team) {
        record(ctx.db, ctx, at, { type: "anonymous", id: null }, "team.login_failed");
        return fail("invalid_code", "We couldn't find a team with that code.");
      }
      const session = ctx.db.transaction((tx) => {
        const s = createSession(tx, "team", team.id, realNow(ctx), { ip: ctx.ip, userAgent: ctx.userAgent });
        record(tx, ctx, at, { type: "team", id: team.id }, "team.login", { type: "team", id: team.id });
        return s;
      });
      ctx.cookies.set(SESSION_COOKIE.team, session.token, SESSION_TTL_MS.team / 1000);
      return ok({ teamId: team.id });
    },

    async logout(): Promise<void> {
      deleteSession(ctx.db, ctx.cookies.get(SESSION_COOKIE.team));
      ctx.cookies.delete(SESSION_COOKIE.team);
    },

    /** The team that is logged in, or null */
    async getCurrentTeam(): Promise<TeamDetail | null> {
      const team = currentTeam(ctx);
      return team ? teamDetail(ctx.db, team, "team") : null;
    },

    /** "Forgot your code?": the same reply whether or not the email belongs to a team */
    async requestCodeReminder(email: string): Promise<Result<null>> {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) return fail("invalid_input", "Enter a valid email address.");

      const at = now();
      const wait = retryAfterSeconds(ctx.db, "team.code_reminder_requested", ctx.ip, at);
      if (wait !== null) return rateLimited(wait);

      ctx.db.transaction((tx) => {
        // Every request counts toward the limit, matching or not, so the limit can't be used to find emails
        record(tx, ctx, at, { type: "anonymous", id: null }, "team.code_reminder_requested");
        const leader = tx
          .select()
          .from(schema.members)
          .where(and(eq(schema.members.email, parsed.data), eq(schema.members.position, 1)))
          .get();
        const team = leader && tx.select().from(schema.teams).where(eq(schema.teams.id, leader.teamId)).get();
        // Per team too, so requests from many addresses can't flood the leader. The reply stays the same
        if (leader && team && !codeReminderSentRecently(tx, team.id, at)) {
          queueEmail(tx, at, team.id, leader.email, "code_reminder", { code: team.code, teamName: team.name });
          record(tx, ctx, at, { type: "anonymous", id: null }, "team.code_reminder", { type: "team", id: team.id });
        }
      });
      return ok(null);
    },

    /**
     * Saves a proposal PDF (POST /api/team/proposal). Checks the session, stage, deadline, size
     * and `%PDF-` signature, uploads to Drive, then records the new version in one transaction.
     */
    async uploadProposal(file: { fileName: string; bytes: Uint8Array }): Promise<Result<{ version: number }>> {
      const team = currentTeam(ctx);
      if (!team) return fail("not_logged_in", "Log in with your team code first.");
      if (!BEFORE_DECISION.includes(team.stage)) return fail("not_allowed", "This team can't submit a proposal any more.");
      const deadline = Date.parse(readDeadlines(ctx.db).proposalDue);
      if (now() > deadline) return fail("proposal_deadline_passed", "The proposal deadline has passed.");

      const check = proposalFileSchema.safeParse({ fileName: file.fileName, sizeBytes: file.bytes.byteLength });
      if (!check.success) {
        return fail("invalid_input", check.error.issues[0].message, {
          issues: check.error.issues.map((i) => ({ path: "file", message: i.message })),
        });
      }
      if (!hasPdfHeader(file.bytes)) {
        return fail("invalid_input", "That file doesn't look like a PDF.", {
          issues: [{ path: "file", message: "That file doesn't look like a PDF." }],
        });
      }

      const drive = ctx.services.drive();
      if (!drive.ok) {
        console.error(`Proposal upload refused: Drive is not set up (missing ${drive.missing.join(", ")})`);
        return fail("not_configured", "Proposal uploads aren't set up yet. Please try again later or contact the organizers.");
      }

      const previous = ctx.db
        .select({ version: max(schema.submissions.version) })
        .from(schema.submissions)
        .where(and(eq(schema.submissions.teamId, team.id), eq(schema.submissions.kind, "proposal")))
        .get();
      const version = (previous?.version ?? 0) + 1;
      const fileName = `${team.code} – ${team.name} – v${version}.pdf`;
      const sha256 = createHash("sha256").update(file.bytes).digest("hex");

      let stored;
      try {
        stored = await drive.service.upload({ fileName, category: team.category, bytes: file.bytes });
      } catch (error) {
        console.error("Proposal upload to Drive failed", error);
        return fail("upload_failed", "We couldn't store your proposal. Nothing was saved; please try again.");
      }

      // The deadline may have passed during a slow upload
      const at = now();
      if (at > deadline) return fail("proposal_deadline_passed", "The proposal deadline passed while the file was uploading.");

      try {
        return ok(
          ctx.db.transaction((tx) => {
            tx.update(schema.submissions)
              .set({ isCurrent: false })
              .where(and(eq(schema.submissions.teamId, team.id), eq(schema.submissions.kind, "proposal")))
              .run();
            tx.insert(schema.submissions)
              .values({
                teamId: team.id,
                kind: "proposal",
                version,
                isCurrent: true,
                driveFileId: stored.fileId,
                driveUrl: stored.url,
                fileName,
                sizeBytes: file.bytes.byteLength,
                sha256,
                submittedAt: at,
                submittedIp: ctx.ip ?? "unknown",
              })
              .run();
            tx.update(schema.teams)
              .set({ stage: team.stage === "registered" ? "proposal_submitted" : team.stage, updatedAt: at })
              .where(eq(schema.teams.id, team.id))
              .run();
            const leader = leaderOf(tx, team.id)!;
            queueEmail(tx, at, team.id, leader.email, "proposal_received", { teamName: team.name });
            record(tx, ctx, at, { type: "team", id: team.id }, "proposal.uploaded", { type: "team", id: team.id }, { version, sha256 });
            return { version };
          }),
        );
      } catch (error) {
        // Two uploads from the same team at once: both got the same version number
        if (isUniqueViolation(error)) return fail("upload_failed", "Another upload finished at the same time. Please check your portal.");
        throw error;
      }
    },

    async submitPrototype(link: string): Promise<Result<{ version: number; youtubeUrl: string }>> {
      const team = currentTeam(ctx);
      if (!team) return fail("not_logged_in", "Log in with your team code first.");
      // Only teams with a published "shortlisted" result, even while the list is reopened. Finalists are locked
      if (!SHORTLISTED.includes(team.stage)) return fail("not_allowed", "Only shortlisted teams can submit a prototype.");
      if (now() > Date.parse(readDeadlines(ctx.db).prototypeDue)) {
        return fail("prototype_deadline_passed", "The prototype deadline has passed.");
      }

      const parsed = prototypeLinkSchema.safeParse(link);
      if (!parsed.success) {
        const message = parsed.error.issues[0].message;
        return fail("invalid_input", message, { issues: [{ path: "link", message }] });
      }
      const { youtubeId, youtubeUrl } = parsed.data;

      let exists: boolean;
      try {
        exists = await ctx.services.youtubeVideoExists(youtubeId);
      } catch {
        // YouTube itself is unreachable: accept the link rather than block the team; organizers can check it
        exists = true;
      }
      if (!exists) {
        const message = "We couldn't find that video. Make sure it's public or unlisted, not private.";
        return fail("video_unavailable", message, { issues: [{ path: "link", message }] });
      }

      const at = now();
      try {
        return ok(
          ctx.db.transaction((tx) => {
            const previous = tx
              .select({ version: max(schema.submissions.version) })
              .from(schema.submissions)
              .where(and(eq(schema.submissions.teamId, team.id), eq(schema.submissions.kind, "prototype")))
              .get();
            const version = (previous?.version ?? 0) + 1;
            tx.update(schema.submissions)
              .set({ isCurrent: false })
              .where(and(eq(schema.submissions.teamId, team.id), eq(schema.submissions.kind, "prototype")))
              .run();
            tx.insert(schema.submissions)
              .values({
                teamId: team.id,
                kind: "prototype",
                version,
                isCurrent: true,
                youtubeId,
                youtubeUrl,
                submittedAt: at,
                submittedIp: ctx.ip ?? "unknown",
              })
              .run();
            tx.update(schema.teams).set({ stage: "prototype_submitted", updatedAt: at }).where(eq(schema.teams.id, team.id)).run();
            const leader = leaderOf(tx, team.id)!;
            queueEmail(tx, at, team.id, leader.email, "prototype_received", { teamName: team.name });
            record(tx, ctx, at, { type: "team", id: team.id }, "prototype.submitted", { type: "team", id: team.id }, { version });
            return { version, youtubeUrl };
          }),
        );
      } catch (error) {
        if (isUniqueViolation(error)) return fail("upload_failed", "Another submission finished at the same time. Please check your portal.");
        throw error;
      }
    },
  };
}
