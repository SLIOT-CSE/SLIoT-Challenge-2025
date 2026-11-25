import { eq } from "drizzle-orm";
import { generatePassword } from "@/lib/admin-password";
import { newAdminSchema } from "@/lib/schemas";
import { hashPassword } from "@/server/auth/passwords";
import { openDatabase, runMigrations } from "@/server/db/client";
import { admins, auditLog } from "@/server/db/schema";
import { databasePath } from "@/server/env";

// `pnpm admin:create <username> "<Display name>" [super_admin|admin]`
// Creates an organizer account on the server and prints its generated password once
// (docs/architecture.md, 6.5: how the first super admin is made). The role defaults to super_admin.

async function main() {
  const [username, displayName, role = "super_admin"] = process.argv.slice(2);
  const parsed = newAdminSchema.safeParse({ username, displayName, role });
  if (!parsed.success) {
    console.error('Usage: pnpm admin:create <username> "<Display name>" [super_admin|admin]');
    for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    process.exit(1);
  }
  const data = parsed.data;

  const db = openDatabase(databasePath());
  runMigrations(db);
  if (db.select({ id: admins.id }).from(admins).where(eq(admins.username, data.username)).get()) {
    console.error(`The username "${data.username}" is taken.`);
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  db.transaction((tx) => {
    const row = tx
      .insert(admins)
      .values({ username: data.username, displayName: data.displayName, role: data.role, passwordHash, createdAt: now })
      .returning({ id: admins.id })
      .get();
    tx.insert(auditLog)
      .values({
        actorType: "system",
        action: "admin.created",
        targetType: "admin",
        targetId: String(row.id),
        details: { username: data.username, role: data.role, via: "pnpm admin:create" },
        createdAt: now,
      })
      .run();
  });
  db.$client.close();

  console.log(`Created ${data.role === "super_admin" ? "super admin" : "admin"} "${data.username}" (${data.displayName}).`);
  console.log(`Password (shown once, pass it on privately): ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
