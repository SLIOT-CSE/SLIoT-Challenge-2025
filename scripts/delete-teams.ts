import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "@/server/db/client";
import { deleteTeams, planDeletion } from "@/server/delete-teams";
import { databasePath } from "@/server/env";

// `pnpm team:delete <code> [<code> ...]` shows what would be removed and changes nothing.
// Add `--yes` to delete: a copy of the database is saved beside it first.

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes("--yes");
  const codes = args.filter((a) => a !== "--yes");
  const unknown = codes.find((a) => a.startsWith("-"));
  if (unknown || codes.length === 0) {
    console.error("Usage: pnpm team:delete <team code> [<team code> ...] [--yes]");
    process.exit(1);
  }

  const file = databasePath();
  if (!fs.existsSync(file)) {
    console.error(`There is no database at ${file}.`);
    process.exit(1);
  }
  console.log(`Database: ${file}\n`);
  const db = openDatabase(file);

  const plan = planDeletion(db, codes);
  if (!plan.ok) {
    console.error("Nothing was deleted:");
    for (const problem of plan.problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.table(
    plan.teams.map((t) => ({ code: t.code, team: t.name, leader: t.leaderEmail, members: t.memberCount, emails: t.emailCount, files: t.driveLinks.length })),
  );

  if (!confirmed) {
    console.log("Nothing was changed. To delete these teams, run the same command with --yes.");
    db.$client.close();
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const copy = path.join(path.dirname(file), `before-team-delete-${stamp}.db`);
  // Made owner-only before SQLite writes into it: it holds personal data
  fs.writeFileSync(copy, "", { mode: 0o600, flag: "wx" });
  await db.$client.backup(copy);

  const result = deleteTeams(db, codes);
  db.$client.close();
  if (!result.ok) {
    console.error("Nothing was deleted:");
    for (const problem of result.problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(`Deleted ${result.teams.length} team(s).`);
  console.log(`Copy of the database from before: ${copy}`);
  console.log("It holds personal data: delete it once you've checked the result.");
  const links = result.teams.flatMap((t) => t.driveLinks);
  if (links.length > 0) {
    console.log("\nRemove these proposal files from Drive by hand:");
    for (const link of links) console.log(`  ${link}`);
  }
  console.log("\nIf the teams were exported to Google Sheets, export again from the dashboard.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
