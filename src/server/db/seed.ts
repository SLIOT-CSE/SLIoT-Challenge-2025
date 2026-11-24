import { hash } from "@node-rs/argon2";
import { sql } from "drizzle-orm";
import type { Db } from "./client";
import * as schema from "./schema";
import { buildSeedData, type SeedData } from "./seed-data";

// Wipes every table and writes the seed data, in one transaction: either the whole data set
// is in place afterwards, or nothing changed. Used by `pnpm db:seed` and by tests.

/** Children before parents, so foreign keys never block a delete */
const WIPE_ORDER = [
  schema.sessions,
  schema.auditLog,
  schema.emailOutbox,
  schema.shortlistFinalisations,
  schema.submissions,
  schema.members,
  schema.teams,
  schema.settings,
  schema.admins,
] as const;

export async function seedDatabase(db: Db, data: SeedData = buildSeedData()): Promise<SeedData> {
  // Hash first: argon2 is async, and better-sqlite3 transactions must be synchronous
  const admins = await Promise.all(
    data.admins.map(async ({ password, ...admin }) => ({ ...admin, passwordHash: await hash(password) })),
  );

  db.transaction((tx) => {
    for (const table of WIPE_ORDER) tx.delete(table).run();
    // Restart the id counters, so seeded ids are the same on every run
    tx.run(sql`DELETE FROM sqlite_sequence`);

    tx.insert(schema.admins).values(admins).run();
    tx.insert(schema.teams).values(data.teams).run();
    tx.insert(schema.members).values(data.members).run();
    tx.insert(schema.submissions).values(data.submissions).run();
    // The dev clock runs from the moment of seeding (its updated_at is real time)
    const seededAt = Date.now();
    tx.insert(schema.settings)
      .values(data.settings.map((row) => (row.key === "dev_now" ? { ...row, updatedAt: seededAt } : row)))
      .run();
    tx.insert(schema.shortlistFinalisations).values(data.shortlistFinalisations).run();
    tx.insert(schema.emailOutbox).values(data.emailOutbox).run();
    tx.insert(schema.auditLog).values(data.auditLog).run();
  });

  return data;
}
