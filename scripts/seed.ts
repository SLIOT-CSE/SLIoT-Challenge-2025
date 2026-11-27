import { openDatabase, runMigrations } from "@/server/db/client";
import { seedDatabase } from "@/server/db/seed";
import { SEED_ADMIN_LOGINS, seedTeamLogins } from "@/server/db/seed-data";
import { databasePath, getEnv } from "@/server/env";
import { TEAM_STAGE_LABELS } from "@/lib/team-rules";

// `pnpm db:seed`: wipes the local development database and fills it with the fixed test data
// (20 teams in prototype-round stages). Development only.

const env = getEnv();
const file = databasePath(env);

if (env.NODE_ENV === "production" || file.replace(/\\/g, "/").includes("/var/lib/sliot")) {
  console.error(`Refusing to seed ${file}: the seed wipes every table and is for development only.`);
  process.exit(1);
}

async function main() {
  const db = openDatabase(file);
  runMigrations(db);
  const data = await seedDatabase(db);
  db.$client.close();

  const colombo = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" });

  console.log(`Seeded ${file}`);
  console.log(
    `  ${data.teams.length} teams, ${data.members.length} members, ${data.submissions.length} submissions, ` +
      `${data.emailOutbox.length} emails, ${data.auditLog.length} audit entries`,
  );
  console.log(`  The data is dated as of ${colombo.format(data.asOf)} (prototype round).`);
  console.log("  The app uses the real clock: the stage follows the deadlines in /admin/settings.\n");

  console.log("Organizer logins (/admin/login):");
  console.table(SEED_ADMIN_LOGINS.map(({ username, password, role }) => ({ username, password, role })));

  console.log("Team codes (/team):");
  console.table(seedTeamLogins(data).map(({ code, name, stage }) => ({ code, team: name, stage: TEAM_STAGE_LABELS[stage] })));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
