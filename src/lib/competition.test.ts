import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import {
  countsDownToRegistrationClose,
  progressBetween,
  teamPortalOpen,
  stageAt,
  STAGES,
} from "@/lib/competition";

describe("stageAt", () => {
  it("is before-registration before the opening time", () => {
    expect(stageAt(new Date("2026-11-26T00:00:00+05:30"), deadlines)).toBe("before-registration");
  });

  it("is registration while registration is open", () => {
    expect(stageAt(new Date("2026-12-15T12:00:00+05:30"), deadlines)).toBe("registration");
  });

  it("stays in finale across both Grand Finale and Shark Tank days", () => {
    expect(stageAt(new Date("2027-03-28T15:00:00+05:30"), deadlines)).toBe("finale");
  });

  it("is over after the finale weekend", () => {
    expect(stageAt(new Date("2027-03-29T10:00:00+05:30"), deadlines)).toBe("over");
  });
});

describe("teamPortalOpen", () => {
  it("is locked until the moment proposal submissions open", () => {
    const opens = Date.parse(deadlines.proposalOpens);
    expect(teamPortalOpen(new Date(opens - 1), deadlines)).toBe(false);
    expect(teamPortalOpen(new Date(opens), deadlines)).toBe(true);
  });
});

describe("countsDownToRegistrationClose", () => {
  it("covers only the stages before registration has closed", () => {
    expect(STAGES.filter(countsDownToRegistrationClose)).toEqual(["before-registration", "registration"]);
  });
});

describe("progressBetween", () => {
  const from = "2027-01-01T00:00:00+05:30";
  const to = "2027-01-11T00:00:00+05:30";

  it("runs from 0 to 1 and stays inside that range", () => {
    expect(progressBetween(Date.parse("2026-12-01T00:00:00+05:30"), from, to)).toBe(0);
    expect(progressBetween(Date.parse("2027-01-06T00:00:00+05:30"), from, to)).toBe(0.5);
    expect(progressBetween(Date.parse("2027-02-01T00:00:00+05:30"), from, to)).toBe(1);
  });

  it("copes with a window that closes before it opens", () => {
    expect(progressBetween(Date.parse(to), to, from)).toBe(1);
  });
});
