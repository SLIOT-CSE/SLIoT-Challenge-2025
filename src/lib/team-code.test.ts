import { describe, expect, it } from "vitest";
import { teamCodeSchema } from "@/lib/schemas";
import { CODE_ALPHABET, formatCodeInput, generateTeamCode, normaliseTeamCode } from "@/lib/team-code";

describe("generateTeamCode", () => {
  it("has the SL27-XXXX-XXXX shape and only Crockford characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateTeamCode();
      expect(code).toMatch(/^SL27-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(code.slice(5).replace("-", "")).toMatch(new RegExp(`^[${CODE_ALPHABET}]{8}$`));
    }
  });

  it("never uses I, L, O or U", () => {
    for (let i = 0; i < 200; i++) expect(generateTeamCode().slice(5)).not.toMatch(/[ILOU]/);
  });

  it("is built from the random bytes it is given", () => {
    let n = 0;
    expect(generateTeamCode(() => n++)).toBe("SL27-0123-4567");
  });

  it("differs between calls", () => {
    expect(new Set(Array.from({ length: 50 }, () => generateTeamCode())).size).toBe(50);
  });
});

describe("normaliseTeamCode", () => {
  it.each([
    ["SL27-7KQ4-M9XD", "SL27-7KQ4-M9XD"],
    ["sl27-7kq4-m9xd", "SL27-7KQ4-M9XD"],
    ["  SL27 7KQ4 M9XD ", "SL27-7KQ4-M9XD"],
    ["7KQ4M9XD", "SL27-7KQ4-M9XD"],
    ["SL27-7KQ4-M9XD".replace("M9XD", "MOXD"), "SL27-7KQ4-M0XD"], // O read as 0
    ["SL27-7KQ4-ML1D", "SL27-7KQ4-M11D"], // L read as 1
  ])("reads %s", (raw, expected) => {
    expect(normaliseTeamCode(raw)).toBe(expected);
  });

  it.each(["", "SL27-7KQ4", "SL27-7KQ4-M9XD-1", "SL27-7KQU-M9XD", "SL27-7KQ4-M9X!"])("rejects %s", (raw) => {
    expect(normaliseTeamCode(raw)).toBeNull();
  });

  it("works as a zod schema", () => {
    expect(teamCodeSchema.parse("sl27-7kq4-m9xd")).toBe("SL27-7KQ4-M9XD");
    expect(teamCodeSchema.safeParse("nope").success).toBe(false);
  });
});

describe("formatCodeInput", () => {
  it.each([
    ["", ""],
    ["7k", "7K"],
    ["7kq4", "7KQ4"],
    ["7kq4m", "7KQ4-M"],
    ["7kq4m9xd", "7KQ4-M9XD"],
    ["7kq4m9xdextra", "7KQ4-M9XD"],
    ["SL27-7KQ4-M9XD", "7KQ4-M9XD"], // pasted in full
    ["7K-Q4 M9!XD", "7KQ4-M9XD"],
    ["7KQU", "7KQ"], // U is not in the alphabet
  ])("formats %j as %j", (raw, expected) => {
    expect(formatCodeInput(raw)).toBe(expected);
  });
});
