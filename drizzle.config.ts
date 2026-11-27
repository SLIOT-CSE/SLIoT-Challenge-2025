import { defineConfig } from "drizzle-kit";

// Used by `pnpm db:generate` (writes a migration from schema changes) and `pnpm db:studio`.
// Migrations are applied by `pnpm db:migrate` (scripts/migrate.ts), which uses the app's own client.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: { url: process.env.DATABASE_PATH || "./data/sliot.db" },
  strict: true,
  verbose: true,
});
