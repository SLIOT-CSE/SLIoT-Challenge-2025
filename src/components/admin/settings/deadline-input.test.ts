import { describe, expect, it } from "vitest";
import { formatUntil, inputToIso, isoToInput } from "./deadline-input";

describe("deadline input", () => {
  it("shows a stored time as Sri Lanka wall-clock time", () => {
    expect(isoToInput("2027-03-15T23:59:00+05:30")).toBe("2027-03-15T23:59");
    // The same moment written in UTC still reads as Sri Lanka time
    expect(isoToInput("2027-03-15T18:29:00Z")).toBe("2027-03-15T23:59");
  });

  it("turns the box's value back into a +05:30 time", () => {
    expect(inputToIso("2027-03-15T23:59")).toBe("2027-03-15T23:59:00+05:30");
  });

  it("round-trips", () => {
    const iso = "2027-06-15T23:59:00+05:30";
    expect(inputToIso(isoToInput(iso))).toBe(iso);
  });

  it("rejects an empty or partial value", () => {
    expect(inputToIso("")).toBeNull();
    expect(inputToIso("2027-03-15")).toBeNull();
    expect(inputToIso("2027-13-45T99:99")).toBeNull();
  });
});

describe("formatUntil", () => {
  const now = Date.parse("2027-03-01T00:00:00Z");
  const h = 3600 * 1000;
  it("counts forward and back", () => {
    expect(formatUntil(now + 10 * 24 * h, now)).toBe("in 10 days");
    expect(formatUntil(now + 5 * h, now)).toBe("in 5 hours");
    expect(formatUntil(now + 90 * 1000, now)).toBe("in 2 minutes");
    expect(formatUntil(now - 24 * h * 3, now)).toBe("3 days ago");
    expect(formatUntil(now - h, now)).toBe("1 hour ago");
  });
  it("says now for the same minute", () => {
    expect(formatUntil(now + 20 * 1000, now)).toBe("now");
  });
});
