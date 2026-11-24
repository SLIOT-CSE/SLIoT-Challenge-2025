import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import { STAGES, stageAt } from "@/lib/competition";
import { registrationInputSchema } from "@/lib/schemas";
import { normaliseTeamCode } from "@/lib/team-code";
import { TEAM_STAGES } from "@/lib/team-rules";
import { sampleTimeForStage } from "./clock";
import { generateSampleState } from "./sample";

describe("generateSampleState", () => {
  const state = generateSampleState();

  it("is the same every time", () => {
    expect(generateSampleState()).toEqual(state);
  });

  it("has 20 teams: 7 School, 8 University, 5 Open", () => {
    expect(state.teams).toHaveLength(20);
    const count = (c: string) => state.teams.filter((t) => t.category === c).length;
    expect([count("school"), count("university"), count("open")]).toEqual([7, 8, 5]);
  });

  it("covers every team stage", () => {
    for (const stage of TEAM_STAGES) expect(state.teams.some((t) => t.stage === stage)).toBe(true);
  });

  it("gives every team 1 to 5 members with the leader at position 1", () => {
    for (const team of state.teams) {
      const members = state.members.filter((m) => m.teamId === team.id).sort((a, b) => a.position - b.position);
      expect(members.length).toBeGreaterThanOrEqual(1);
      expect(members.length).toBeLessThanOrEqual(5);
      expect(members.map((m) => m.position)).toEqual(members.map((_, i) => i + 1));
    }
  });

  it("has unique team codes, emails and NICs, and valid codes", () => {
    const unique = (values: (string | null)[]) => {
      const real = values.filter((v): v is string => v !== null);
      return new Set(real).size === real.length;
    };
    expect(unique(state.teams.map((t) => t.code))).toBe(true);
    expect(unique(state.members.map((m) => m.email))).toBe(true);
    expect(unique(state.members.map((m) => m.nic))).toBe(true);
    for (const t of state.teams) expect(normaliseTeamCode(t.code)).toBe(t.code);
  });

  it("uses only obviously fake contact details", () => {
    for (const m of state.members) {
      expect(m.email).toMatch(/@example\.lk$/);
      if (m.nic) expect(m.nic).toMatch(/^2099\d{8}$/);
      expect(m.whatsapp).toMatch(/^\+94700\d{6}$/);
    }
  });

  it("passes the registration rules for every team", () => {
    for (const team of state.teams) {
      const members = state.members.filter((m) => m.teamId === team.id);
      const input = {
        name: team.name,
        category: team.category,
        institutionName: team.institutionName ?? undefined,
        institutionIsOther: team.institutionIsOther,
        consent: true,
        members: members.map((m) => ({
          fullName: m.fullName,
          whatsapp: m.whatsapp,
          email: m.email,
          nic: m.nic ?? undefined,
          institutionType: team.category === "open" ? m.institutionType : undefined,
          institutionName: team.category === "open" ? m.institutionName : undefined,
          institutionIsOther: m.institutionIsOther,
        })),
      };
      const result = registrationInputSchema.safeParse(input);
      expect(result.success, `${team.name}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });

  it("has a proposal for every team past registration, and a video for prototype teams", () => {
    for (const team of state.teams) {
      const proposals = state.submissions.filter((s) => s.teamId === team.id && s.kind === "proposal");
      const prototypes = state.submissions.filter((s) => s.teamId === team.id && s.kind === "prototype");
      expect(proposals.length > 0).toBe(team.stage !== "registered");
      if (proposals.length) expect(proposals.filter((p) => p.isCurrent)).toHaveLength(1);
      expect(prototypes.length > 0).toBe(team.stage === "prototype_submitted");
    }
  });

  it("starts with registration open and the shortlist finalised", () => {
    expect(stageAt(new Date(state.settings.now!), deadlines)).toBe("registration");
    expect(state.settings.shortlistState).toBe("finalised");
    expect(state.finalisations).toHaveLength(1);
  });
});

describe("sampleTimeForStage", () => {
  it.each(STAGES)("lands inside %s", (stage) => {
    expect(stageAt(new Date(sampleTimeForStage(stage, deadlines)), deadlines)).toBe(stage);
  });
});
