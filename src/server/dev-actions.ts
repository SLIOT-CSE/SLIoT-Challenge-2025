"use server";

import { asc, eq } from "drizzle-orm";
import { sampleTimeForStage } from "@/lib/data/clock";
import { stageAt, type Stage } from "@/lib/competition";
import type { ShortlistState } from "@/lib/data/types";
import { createSession, deleteSession, readSession, SESSION_COOKIE, SESSION_TTL_MS } from "./auth/sessions";
import { nowFor, realNow } from "./backend/context";
import * as schema from "./db/schema";
import { seedDatabase } from "./db/seed";
import { SEED_ADMIN_LOGINS } from "./db/seed-data";
import { getEnv } from "./env";
import { requestContext } from "./request";
import { deleteSetting, readDeadlines, readDevNow, readShortlistState, SETTING_KEYS, writeDevNow, writeSetting } from "./settings";

// Development-only controls for the sample-data switcher on /register, /team and /admin. They
// move the dev clock, flip the shortlist state, sign in without typing and reseed the database,
// skipping the checks the real flows have. Every one refuses to run in production.

function devOnly(): void {
  if (getEnv().NODE_ENV === "production") throw new Error("Development only");
}

export interface DevTeamLogin {
  id: number;
  code: string;
  name: string;
  category: string;
  stage: string;
}

export interface DevAdminLogin {
  id: number;
  username: string;
  displayName: string;
  role: string;
  /** The seeded dev password, or null for accounts made later (their password was shown once) */
  password: string | null;
  disabled: boolean;
}

export interface DevState {
  now: number;
  /** True when the dev clock is set; false when the real clock is used */
  devClock: boolean;
  stage: Stage;
  shortlistState: ShortlistState;
  teamId: number | null;
  adminId: number | null;
  teams: DevTeamLogin[];
  admins: DevAdminLogin[];
}

export async function getDevState(): Promise<DevState> {
  devOnly();
  const ctx = await requestContext();
  const { db } = ctx;
  const now = nowFor(ctx);
  const sessionOf = (type: "team" | "admin") => {
    const token = ctx.cookies.get(SESSION_COOKIE[type]);
    return readSession(db, type, token, realNow(ctx));
  };
  return {
    now,
    devClock: readDevNow(db, false) !== null,
    stage: stageAt(new Date(now), readDeadlines(db)),
    shortlistState: readShortlistState(db),
    teamId: sessionOf("team"),
    adminId: sessionOf("admin"),
    teams: db
      .select({ id: schema.teams.id, code: schema.teams.code, name: schema.teams.name, category: schema.teams.category, stage: schema.teams.stage })
      .from(schema.teams)
      .orderBy(asc(schema.teams.id))
      .all(),
    admins: db
      .select()
      .from(schema.admins)
      .orderBy(asc(schema.admins.id))
      .all()
      .map((a) => ({
        id: a.id,
        username: a.username,
        displayName: a.displayName,
        role: a.role,
        // Only while the seeded account still has its seeded username
        password: SEED_ADMIN_LOGINS.find((s) => s.id === a.id && s.username === a.username)?.password ?? null,
        disabled: a.disabled,
      })),
  };
}

/** The seeded organizer logins, for the dev box on /admin/login. Empty in production */
export async function listDevAdminLogins(): Promise<{ username: string; password: string; displayName: string; role: string }[]> {
  if (getEnv().NODE_ENV === "production") return [];
  return SEED_ADMIN_LOGINS.map(({ username, password, displayName, role }) => ({ username, password, displayName, role }));
}

/** Moves the dev clock to the middle of a competition stage */
export async function setDevStage(stage: Stage): Promise<void> {
  devOnly();
  const { db } = await requestContext();
  writeDevNow(db, sampleTimeForStage(stage, readDeadlines(db)));
}

/** Back to the real clock */
export async function switchToRealClock(): Promise<void> {
  devOnly();
  const { db } = await requestContext();
  deleteSetting(db, SETTING_KEYS.devNow);
}

export async function setDevShortlistState(state: ShortlistState): Promise<void> {
  devOnly();
  const ctx = await requestContext();
  writeSetting(ctx.db, SETTING_KEYS.shortlistState, state, null, nowFor(ctx));
}

/** Signs in as any team without typing its code */
export async function loginAsDevTeam(teamId: number): Promise<void> {
  devOnly();
  const ctx = await requestContext();
  const team = ctx.db.select({ id: schema.teams.id }).from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return;
  deleteSession(ctx.db, ctx.cookies.get(SESSION_COOKIE.team));
  const { token } = createSession(ctx.db, "team", team.id, realNow(ctx), { ip: ctx.ip, userAgent: ctx.userAgent });
  ctx.cookies.set(SESSION_COOKIE.team, token, SESSION_TTL_MS.team / 1000);
}

/** Signs in as an organizer without typing the password */
export async function loginAsDevAdmin(adminId: number): Promise<void> {
  devOnly();
  const ctx = await requestContext();
  const admin = ctx.db.select().from(schema.admins).where(eq(schema.admins.id, adminId)).get();
  if (!admin || admin.disabled) return;
  const at = nowFor(ctx);
  deleteSession(ctx.db, ctx.cookies.get(SESSION_COOKIE.admin));
  ctx.db.update(schema.admins).set({ lastLoginAt: at }).where(eq(schema.admins.id, adminId)).run();
  const { token } = createSession(ctx.db, "admin", admin.id, realNow(ctx), { ip: ctx.ip, userAgent: ctx.userAgent });
  ctx.cookies.set(SESSION_COOKIE.admin, token, SESSION_TTL_MS.admin / 1000);
}

/** Same as `pnpm db:seed`: wipes the database and writes the 20 test teams. Signs everyone out */
export async function resetDevData(): Promise<void> {
  devOnly();
  const ctx = await requestContext();
  await seedDatabase(ctx.db);
  ctx.cookies.delete(SESSION_COOKIE.team);
  ctx.cookies.delete(SESSION_COOKIE.admin);
}
