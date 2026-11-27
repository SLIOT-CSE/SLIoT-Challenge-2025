import { eq } from "drizzle-orm";
import { deadlines as contentDeadlines, type Deadlines } from "@/content/deadlines";
import type { DeadlineSettings, ShortlistState } from "@/lib/data/types";
import type { Db } from "./db/client";
import { settings } from "./db/schema";

// The settings table (docs/architecture.md, section 5): one JSON value per key.
// The three deadlines super admins change live here; the other key dates (registration opens,
// shortlist announced, finale) are fixed in src/content/deadlines.ts.

type Tx = Pick<Db, "select" | "insert" | "update" | "delete">;

export const SETTING_KEYS = {
  registrationCloses: "registration_closes_at",
  proposalDue: "proposal_due_at",
  prototypeDue: "prototype_due_at",
  shortlistState: "shortlist_state",
  lastSheetExportAt: "last_sheet_export_at",
} as const;

const COLOMBO_OFFSET_MS = 5.5 * 3600 * 1000;

/** Unix ms as an ISO time in Sri Lanka time, like `2027-03-15T23:59:00+05:30` (the form the screens use) */
export function toColomboIso(ms: number): string {
  return `${new Date(ms + COLOMBO_OFFSET_MS).toISOString().slice(0, 19)}+05:30`;
}

export function readSetting<T>(db: Tx, key: string): T | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row ? (JSON.parse(row.value) as T) : null;
}

export function writeSetting(db: Tx, key: string, value: unknown, updatedBy: number | null, now: number): void {
  const json = JSON.stringify(value);
  db.insert(settings)
    .values({ key, value: json, updatedBy, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: json, updatedBy, updatedAt: now } })
    .run();
}

/** All key dates: the stored deadlines over the fixed ones from the content file */
export function readDeadlines(db: Tx): Deadlines {
  const stored = (key: string, fallback: string) => {
    const ms = readSetting<number>(db, key);
    return ms === null ? fallback : toColomboIso(ms);
  };
  return {
    ...contentDeadlines,
    registrationCloses: stored(SETTING_KEYS.registrationCloses, contentDeadlines.registrationCloses),
    proposalDue: stored(SETTING_KEYS.proposalDue, contentDeadlines.proposalDue),
    prototypeDue: stored(SETTING_KEYS.prototypeDue, contentDeadlines.prototypeDue),
  };
}

export function writeDeadlines(db: Tx, next: DeadlineSettings, updatedBy: number, now: number): void {
  writeSetting(db, SETTING_KEYS.registrationCloses, Date.parse(next.registrationCloses), updatedBy, now);
  writeSetting(db, SETTING_KEYS.proposalDue, Date.parse(next.proposalDue), updatedBy, now);
  writeSetting(db, SETTING_KEYS.prototypeDue, Date.parse(next.prototypeDue), updatedBy, now);
}

export function readShortlistState(db: Tx): ShortlistState {
  return readSetting<ShortlistState>(db, SETTING_KEYS.shortlistState) ?? "draft";
}
