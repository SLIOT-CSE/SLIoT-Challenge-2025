import { describe, expect, it } from "vitest";
import { deadlines } from "@/content/deadlines";
import { stageAt } from "@/lib/competition";

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
