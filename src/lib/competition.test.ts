import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import { showsTeamLogin, stageAt, STAGES } from "@/lib/competition";

describe("stageAt", () => {
  it("is before-registration before the opening time", () => {
    expect(stageAt(new Date("2027-01-01T00:00:00+05:30"), deadlines)).toBe("before-registration");
  });

  it("is registration while registration is open", () => {
    expect(stageAt(new Date("2027-02-01T12:00:00+05:30"), deadlines)).toBe("registration");
  });

  it("is over after the finale day", () => {
    expect(stageAt(new Date("2027-08-01T00:00:00+05:30"), deadlines)).toBe("over");
  });
});

describe("showsTeamLogin", () => {
  it("is hidden until the proposal round and shown from then on", () => {
    expect(STAGES.filter(showsTeamLogin)).toEqual(["proposal", "shortlisting", "prototype", "finale", "over"]);
  });

  it("appears the moment registration closes", () => {
    const closes = Date.parse(deadlines.registrationCloses);
    expect(showsTeamLogin(stageAt(new Date(closes), deadlines))).toBe(false);
    expect(showsTeamLogin(stageAt(new Date(closes + 1), deadlines))).toBe(true);
  });
});
