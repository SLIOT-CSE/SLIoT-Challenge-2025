import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { databasePath } from "../env";
import * as schema from "./schema";

// One SQLite file, one connection per process (docs/architecture.md section 4).
// better-sqlite3 is synchronous, so every query in a request runs in order without awaits.

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export const MIGRATIONS_FOLDER = path.resolve("src/server/db/migrations");

/** Opens (and creates, if needed) a database file with the settings the app relies on */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  // WAL lets reads continue while a write is in progress, and is what Litestream copies
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // Wait briefly instead of failing when the seed script or a migration holds the lock
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  return drizzle(sqlite, { schema });
}

/** Brings a database up to the latest migration */
export function runMigrations(db: Db): void {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/** A fresh, migrated in-memory database for tests */
export function openTestDatabase(): Db {
  const db = openDatabase(":memory:");
  runMigrations(db);
  return db;
}

// Kept on globalThis so Next's hot reload in development doesn't open a new connection per edit
const globalForDb = globalThis as typeof globalThis & { __sliotDb?: Db };

/** The app's database. Opened on first use */
export function getDb(): Db {
  globalForDb.__sliotDb ??= openDatabase(databasePath());
  return globalForDb.__sliotDb;
}
