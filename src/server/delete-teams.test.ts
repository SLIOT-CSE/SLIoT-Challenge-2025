import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { seededDb, teamByName } from "./backend/test-context";
import type { Db } from "./db/client";
import * as schema from "./db/schema";
import { deleteTeams, planDeletion } from "./delete-teams";

let db: Db;
beforeEach(async () => {
  db = await seededDb();
});

const shortlistedIds = () => new Set(db.select().from(schema.shortlistFinalisations).all().flatMap((f) => f.teamIds));
const outside = () => db.select().from(schema.teams).all().filter((t) => !shortlistedIds().has(t.id));
const rowsFor = (teamId: number) => ({
  team: db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).all().length,
  members: db.select().from(schema.members).where(eq(schema.members.teamId, teamId)).all().length,
  submissions: db.select().from(schema.submissions).where(eq(schema.submissions.teamId, teamId)).all().length,
  emails: db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.teamId, teamId)).all().length,
});

describe("deleteTeams", () => {
  it("previews without changing anything", () => {
    const team = outside()[0];
    const before = rowsFor(team.id);
    const plan = planDeletion(db, [team.code.toLowerCase()]);
    expect(plan).toMatchObject({ ok: true, teams: [{ code: team.code, memberCount: before.members, emailCount: before.emails }] });
    expect(rowsFor(team.id)).toEqual(before);
  });

  it("removes only the named team, with its rows, and records it", () => {
    const [team, other] = outside();
    const otherBefore = rowsFor(other.id);
    const teamsBefore = db.select().from(schema.teams).all().length;
    const emailsBefore = db.select().from(schema.emailOutbox).all().length;
    const removedEmails = rowsFor(team.id).emails;

    expect(deleteTeams(db, [team.code]).ok).toBe(true);

    expect(rowsFor(team.id)).toEqual({ team: 0, members: 0, submissions: 0, emails: 0 });
    expect(rowsFor(other.id)).toEqual(otherBefore);
    expect(db.select().from(schema.teams).all()).toHaveLength(teamsBefore - 1);
    // Deleted, not left behind with an empty team id
    expect(db.select().from(schema.emailOutbox).all()).toHaveLength(emailsBefore - removedEmails);
    const audit = db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "team.deleted")).all();
    expect(audit).toMatchObject([{ actorType: "system", targetId: String(team.id) }]);
  });

  it("deletes nothing when any code is unknown or shortlisted", () => {
    const fine = outside()[0];
    const shortlisted = teamByName(db, db.select().from(schema.teams).all().find((t) => shortlistedIds().has(t.id))!.name);
    for (const bad of ["SL27-0000-0000", "not a code", shortlisted.code]) {
      const result = deleteTeams(db, [fine.code, bad]);
      expect(result.ok, bad).toBe(false);
      expect(rowsFor(fine.id).team).toBe(1);
    }
    expect(planDeletion(db, []).ok).toBe(false);
  });
});
