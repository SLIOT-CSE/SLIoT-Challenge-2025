import { eq } from "drizzle-orm";
import { sampleTimeForStage } from "@/lib/data/clock";
import type { Stage } from "@/lib/competition";
import { openTestDatabase, type Db } from "../db/client";
import * as schema from "../db/schema";
import { seedDatabase } from "../db/seed";
import { buildSeedData, SEED_ADMIN_LOGINS } from "../db/seed-data";
import { readDeadlines, writeDevNow } from "../settings";
import type { CookieJar, DriveUploader, RequestContext, Services, SheetsExporter } from "./context";
import { createBackend } from "./index";

// Test helpers: a seeded in-memory database and a "browser" with its own cookie jar.

export interface FakeServices {
  drive: DriveUploader | null;
  sheets: SheetsExporter | null;
  uploads: { fileName: string; category: string; size: number }[];
  sheetRows: string[][] | null;
  videoExists: boolean;
}

export const SEED = buildSeedData();
export const [SUPER, ADMIN1, ADMIN2] = SEED_ADMIN_LOGINS;

export async function seededDb(): Promise<Db> {
  const db = openTestDatabase();
  await seedDatabase(db);
  return db;
}

export function fakeServices(): FakeServices {
  const fake: FakeServices = {
    drive: null,
    sheets: null,
    uploads: [],
    sheetRows: null,
    videoExists: true,
  };
  fake.drive = {
    async upload({ fileName, category, bytes }) {
      fake.uploads.push({ fileName, category, size: bytes.byteLength });
      return { fileId: `file-${fake.uploads.length}`, url: `https://drive.google.com/file/d/file-${fake.uploads.length}/view` };
    },
  };
  fake.sheets = {
    async replaceTeamsTab(rows) {
      fake.sheetRows = rows;
    },
  };
  return fake;
}

/** One browser: its own cookies and IP, sharing the database and services */
export function browser(db: Db, fake: FakeServices, ip = "10.0.0.1") {
  const jar = new Map<string, string>();
  const cookies: CookieJar = {
    get: (name) => jar.get(name),
    set: (name, value) => void jar.set(name, value),
    delete: (name) => void jar.delete(name),
  };
  const services: Services = {
    drive: () => (fake.drive ? { ok: true, service: fake.drive } : { ok: false, missing: ["GOOGLE_OAUTH_CLIENT_ID"] }),
    sheets: () => (fake.sheets ? { ok: true, service: fake.sheets } : { ok: false, missing: ["GOOGLE_SHEET_ID"] }),
    youtubeVideoExists: async () => fake.videoExists,
  };
  const ctx: RequestContext = { db, production: false, ip, userAgent: "vitest", cookies, services };
  const backend = createBackend(ctx, async (token) => token !== "bad-token");
  return Object.assign(backend, { jar, ctx });
}

/** Moves the dev clock into a competition stage */
export function setStage(db: Db, stage: Stage): void {
  writeDevNow(db, sampleTimeForStage(stage, readDeadlines(db)));
}

export function teamByName(db: Db, name: string) {
  const team = db.select().from(schema.teams).where(eq(schema.teams.name, name)).get();
  if (!team) throw new Error(`No seeded team ${name}`);
  return team;
}

/** A minimal valid PDF body */
export const PDF = new Uint8Array([...new TextEncoder().encode("%PDF-1.4\n"), ...new Uint8Array(2000)]);
