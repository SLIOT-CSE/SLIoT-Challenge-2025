import { openDatabase, runMigrations } from "@/server/db/client";
import { databasePath } from "@/server/env";

// `pnpm db:migrate`: applies any migrations the database doesn't have yet.
// Safe to run on every deploy; does nothing when the database is up to date.

const file = databasePath();
const db = openDatabase(file);
runMigrations(db);
db.$client.close();
console.log(`Database up to date: ${file}`);
