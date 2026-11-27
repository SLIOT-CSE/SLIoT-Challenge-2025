import { and, asc, eq, inArray } from "drizzle-orm";
import { normaliseTeamCode } from "@/lib/team-code";
import type { Db } from "./db/client";
import * as schema from "./db/schema";

// Removes teams by code, for test registrations made on the live site (`pnpm team:delete`).
// The dashboard has no delete on purpose; this runs only for someone with access to the server.

export interface TeamToDelete {
  id: number;
  code: string;
  name: string;
  leaderEmail: string | null;
  memberCount: number;
  emailCount: number;
  /** Proposal files in Drive. They stay there until removed by hand */
  driveLinks: string[];
}

export type DeletionPlan = { ok: true; teams: TeamToDelete[] } | { ok: false; problems: string[] };

/** What deleting these codes would remove. Any problem refuses the whole list */
export function planDeletion(db: Db, codes: string[]): DeletionPlan {
  const problems: string[] = [];
  const teams: TeamToDelete[] = [];
  const shortlisted = new Set(db.select().from(schema.shortlistFinalisations).all().flatMap((f) => f.teamIds));

  for (const raw of new Set(codes)) {
    const code = normaliseTeamCode(raw);
    const team = code ? db.select().from(schema.teams).where(eq(schema.teams.code, code)).get() : undefined;
    if (!team) {
      problems.push(`${raw}: no team has this code`);
      continue;
    }
    // The shortlist history names its teams, so one that was ever shortlisted must stay
    if (shortlisted.has(team.id)) {
      problems.push(`${team.code} (${team.name}): it is in a finalised shortlist, so it can't be deleted`);
      continue;
    }
    if (teams.some((t) => t.id === team.id)) continue;
    const members = db.select().from(schema.members).where(eq(schema.members.teamId, team.id)).orderBy(asc(schema.members.position)).all();
    const emails = db.select({ id: schema.emailOutbox.id }).from(schema.emailOutbox).where(eq(schema.emailOutbox.teamId, team.id)).all();
    const files = db.select().from(schema.submissions).where(eq(schema.submissions.teamId, team.id)).all();
    teams.push({
      id: team.id,
      code: team.code,
      name: team.name,
      leaderEmail: members[0]?.email ?? null,
      memberCount: members.length,
      emailCount: emails.length,
      driveLinks: files.flatMap((f) => (f.driveUrl ? [f.driveUrl] : [])),
    });
  }

  if (codes.length === 0) problems.push("Give at least one team code");
  return problems.length > 0 ? { ok: false, problems } : { ok: true, teams };
}

/**
 * Deletes the teams with their members, submissions, emails (so a waiting one is never sent)
 * and sessions, in one transaction. The audit log keeps its history and records the deletion.
 */
export function deleteTeams(db: Db, codes: string[], now: number = Date.now()): DeletionPlan {
  return db.transaction(
    () => {
      // Checked again here, in case something changed since the preview
      const plan = planDeletion(db, codes);
      if (!plan.ok) return plan;
      const ids = plan.teams.map((t) => t.id);
      db.delete(schema.sessions).where(and(eq(schema.sessions.subjectType, "team"), inArray(schema.sessions.subjectId, ids))).run();
      db.delete(schema.emailOutbox).where(inArray(schema.emailOutbox.teamId, ids)).run();
      // Members and submissions go with their team (ON DELETE CASCADE)
      db.delete(schema.teams).where(inArray(schema.teams.id, ids)).run();
      for (const team of plan.teams) {
        db.insert(schema.auditLog)
          .values({
            actorType: "system",
            action: "team.deleted",
            targetType: "team",
            targetId: String(team.id),
            details: { code: team.code, name: team.name, via: "pnpm team:delete" },
            createdAt: now,
          })
          .run();
      }
      return plan;
    },
    { behavior: "immediate" },
  );
}
