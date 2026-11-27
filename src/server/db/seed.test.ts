import { verify } from "@node-rs/argon2";
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import { stageAt } from "@/lib/competition";
import { normaliseTeamCode } from "@/lib/team-code";
import { TEAM_SIZE } from "@/lib/team-rules";
import { openTestDatabase } from "./client";
import * as schema from "./schema";
import { seedDatabase } from "./seed";
import { SEED_ADMIN_LOGINS, buildSeedData } from "./seed-data";

const data = buildSeedData();
const membersOf = (teamId: number) => data.members.filter((m) => m.teamId === teamId);
const submissionsOf = (teamId: number, kind: "proposal" | "prototype") =>
  data.submissions.filter((s) => s.teamId === teamId && s.kind === kind);

describe("seed data", () => {
  it("is the agreed prototype-round scenario: 20 teams in the right stages", () => {
    expect(data.teams).toHaveLength(20);
    const count = (stage: string) => data.teams.filter((t) => t.stage === stage).length;
    expect(count("not_shortlisted")).toBe(10);
    expect(count("shortlisted")).toBe(6);
    expect(count("prototype_submitted")).toBe(4);
    expect(new Set(data.teams.map((t) => t.category))).toEqual(new Set(["school", "university", "open"]));
    expect(stageAt(new Date(data.asOf), deadlines)).toBe("prototype");
  });

  it("is the same on every run", () => {
    expect(buildSeedData()).toEqual(data);
  });

  it("follows the team rules", () => {
    for (const team of data.teams) {
      expect(normaliseTeamCode(team.code)).toBe(team.code);
      const members = membersOf(team.id!);
      expect(members.length).toBeGreaterThanOrEqual(TEAM_SIZE.min);
      expect(members.length).toBeLessThanOrEqual(TEAM_SIZE.max);
      expect(members.map((m) => m.position)).toEqual(members.map((_, i) => i + 1));

      for (const m of members) {
        expect(m.email).toBe(m.email.toLowerCase());
        expect(m.whatsapp).toMatch(/^\+947\d{8}$/);
        // NIC for university students and independent entrants, never for school students
        if (m.institutionType === "school") expect(m.nic).toBeNull();
        else expect(m.nic).toMatch(/^\d{12}$/);
        if (m.institutionType === "independent") expect(m.institutionName).toBeNull();
        else expect(m.institutionName).toBeTruthy();
        // School and University teams share one institution
        if (team.category !== "open") {
          expect(m.institutionType).toBe(team.category);
          expect(m.institutionName).toBe(team.institutionName);
        }
      }
      if (team.category === "open") expect(team.institutionName).toBeNull();
    }
    expect(new Set(data.members.map((m) => m.email)).size).toBe(data.members.length);
  });

  it("keeps stages, ticks and submissions consistent", () => {
    for (const team of data.teams) {
      const shortlisted = team.stage === "shortlisted" || team.stage === "prototype_submitted";
      expect(team.shortlistMark).toBe(shortlisted);
      expect(team.shortlistEmailedAt !== null).toBe(shortlisted);
      if (shortlisted) expect(submissionsOf(team.id!, "proposal").length).toBeGreaterThan(0);
      expect(submissionsOf(team.id!, "prototype").length > 0).toBe(team.stage === "prototype_submitted");

      for (const kind of ["proposal", "prototype"] as const) {
        const versions = submissionsOf(team.id!, kind);
        expect(versions.map((s) => s.version)).toEqual(versions.map((_, i) => i + 1));
        if (versions.length) expect(versions.filter((s) => s.isCurrent).map((s) => s.version)).toEqual([versions.length]);
      }
    }
    for (const s of data.submissions) {
      const due = s.kind === "proposal" ? Date.parse(deadlines.proposalDue) : Date.parse(deadlines.prototypeDue);
      expect(s.submittedAt).toBeLessThanOrEqual(Math.min(due, data.asOf));
    }
    expect(data.shortlistFinalisations[0].teamIds).toEqual(data.teams.filter((t) => t.shortlistMark).map((t) => t.id));
  });

  it("never leaves an email waiting to be sent to the invented addresses", () => {
    expect(data.emailOutbox.some((e) => e.status === "pending")).toBe(false);
    expect(data.members.every((m) => m.email.endsWith("@example.lk"))).toBe(true);
  });
});

describe("seedDatabase", () => {
  it("writes everything, hashes the passwords, and gives the same ids when run again", async () => {
    const db = openTestDatabase();
    await seedDatabase(db);
    // Something left over from testing is wiped by the next seed
    db.insert(schema.sessions).values({ id: "x", subjectType: "team", subjectId: 1, createdAt: 0, expiresAt: 1 }).run();
    await seedDatabase(db);

    expect(db.select().from(schema.teams).all()).toHaveLength(20);
    expect(db.select().from(schema.members).all()).toHaveLength(data.members.length);
    expect(db.select().from(schema.sessions).all()).toHaveLength(0);
    const firstMember = db.select().from(schema.members).orderBy(asc(schema.members.id)).get()!;
    expect(firstMember.id).toBe(1);

    const superAdmin = db.select().from(schema.admins).where(eq(schema.admins.username, "super")).get()!;
    expect(superAdmin.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await verify(superAdmin.passwordHash, SEED_ADMIN_LOGINS[0].password)).toBe(true);
  });
});
