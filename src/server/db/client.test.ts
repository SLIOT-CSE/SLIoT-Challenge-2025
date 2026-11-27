import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { openTestDatabase } from "./client";
import { members, teams } from "./schema";

const now = Date.UTC(2027, 0, 1);

function addTeam(db: ReturnType<typeof openTestDatabase>, code: string) {
  return db
    .insert(teams)
    .values({ code, name: `Team ${code}`, category: "university", createdAt: now, updatedAt: now })
    .returning()
    .get();
}

function member(teamId: number, position: number, email: string, nic: string | null) {
  return {
    teamId,
    position,
    fullName: "Test Member",
    whatsapp: "+94771234567",
    email,
    institutionType: "university" as const,
    institutionName: "University of Moratuwa",
    nic,
  };
}

describe("database", () => {
  it("applies the migration with foreign keys and WAL settings on", () => {
    const db = openTestDatabase();
    expect(db.$client.pragma("foreign_keys", { simple: true })).toBe(1);
    const team = addTeam(db, "SL27-AAAA-BBBB");
    expect(team.stage).toBe("registered");
    expect(team.shortlistMark).toBe(false);
  });

  it("keeps one team per email and NIC, but allows many members without a NIC", () => {
    const db = openTestDatabase();
    const a = addTeam(db, "SL27-AAAA-AAAA");
    const b = addTeam(db, "SL27-BBBB-BBBB");
    db.insert(members).values(member(a.id, 1, "a@example.com", null)).run();
    db.insert(members).values(member(a.id, 2, "b@example.com", null)).run();
    db.insert(members).values(member(a.id, 3, "c@example.com", "200012345678")).run();

    expect(() => db.insert(members).values(member(b.id, 1, "a@example.com", null)).run()).toThrow(/UNIQUE/);
    expect(() => db.insert(members).values(member(b.id, 1, "d@example.com", "200012345678")).run()).toThrow(/UNIQUE/);
    expect(() => db.insert(members).values(member(a.id, 2, "e@example.com", null)).run()).toThrow(/UNIQUE/);
  });

  it("rejects values outside the allowed lists and positions outside 1 to 5", () => {
    const db = openTestDatabase();
    const team = addTeam(db, "SL27-CCCC-CCCC");
    expect(() =>
      db.$client
        .prepare("INSERT INTO teams (code, name, category, created_at, updated_at) VALUES ('x', 'y', 'college', 0, 0)")
        .run(),
    ).toThrow(/CHECK/);
    expect(() => db.insert(members).values(member(team.id, 6, "f@example.com", null)).run()).toThrow(/CHECK/);
  });

  it("deletes a team's members with the team", () => {
    const db = openTestDatabase();
    const team = addTeam(db, "SL27-DDDD-DDDD");
    db.insert(members).values(member(team.id, 1, "g@example.com", null)).run();
    db.delete(teams).where(eq(teams.id, team.id)).run();
    expect(db.select().from(members).all()).toHaveLength(0);
  });
});
