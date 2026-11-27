import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import type { Db } from "../db/client";
import { sessions } from "../db/schema";

// Logged-in browsers (docs/architecture.md, 6.2 and section 8). The cookie holds a random
// 32-byte token; the database keeps only its SHA-256, so a copy of the database can't be used
// to log in. Teams stay logged in 7 days, organizers 12 hours.

export type SubjectType = "team" | "admin";

export const SESSION_COOKIE: Record<SubjectType, string> = { team: "sliot_team", admin: "sliot_admin" };
export const SESSION_TTL_MS: Record<SubjectType, number> = { team: 7 * 24 * 3600 * 1000, admin: 12 * 3600 * 1000 };

type Tx = Pick<Db, "select" | "insert" | "update" | "delete">;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Starts a session and returns the raw token for the cookie */
export function createSession(
  db: Tx,
  subjectType: SubjectType,
  subjectId: number,
  now: number,
  meta: { ip: string | null; userAgent: string | null },
): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_TTL_MS[subjectType];
  db.insert(sessions)
    .values({
      id: hashToken(token),
      subjectType,
      subjectId,
      createdAt: now,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .run();
  return { token, expiresAt };
}

/** The subject id for a token, or null when it's unknown, of another type or expired */
export function readSession(db: Tx, subjectType: SubjectType, token: string | undefined, now: number): number | null {
  if (!token) return null;
  const row = db.select().from(sessions).where(eq(sessions.id, hashToken(token))).get();
  if (!row || row.subjectType !== subjectType) return null;
  if (row.expiresAt <= now) {
    db.delete(sessions).where(eq(sessions.id, row.id)).run();
    return null;
  }
  return row.subjectId;
}

export function deleteSession(db: Tx, token: string | undefined): void {
  if (token) db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
}

/** Ends every session of one team or organizer (password reset, account disabled) */
export function deleteSubjectSessions(db: Tx, subjectType: SubjectType, subjectId: number): void {
  db.delete(sessions).where(and(eq(sessions.subjectType, subjectType), eq(sessions.subjectId, subjectId))).run();
}

/** Removes expired rows. Run daily by the background worker */
export function deleteExpiredSessions(db: Tx, now: number): number {
  return db.delete(sessions).where(lt(sessions.expiresAt, now)).run().changes;
}
