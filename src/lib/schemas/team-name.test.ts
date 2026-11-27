import { describe, expect, it } from "vitest";
import { teamNameSchema } from "./fields";

const ok = (name: string) => teamNameSchema.safeParse(name).success;

describe("team name", () => {
  it("accepts ordinary names, including dots that can't read as a link", () => {
    for (const name of ["Kite Runners", "A.I. Squad", "Team 2.0", "Dr. Volt", "IoT @ Mora", "ක්\u200dරියා", "Byte-Me!"]) {
      expect(ok(name), name).toBe(true);
    }
  });

  it("refuses links and web addresses, however they are written", () => {
    for (const name of [
      "Win at http://bad.example",
      "www.bad",
      "bad.example",
      "Free bit.ly/x",
      "mail me@bad.com",
      "bad\uff0eexample",
      "bad\u200b.example",
      "bad\u3002com",
    ]) {
      expect(ok(name), name).toBe(false);
    }
  });

  it("refuses line breaks and control characters", () => {
    for (const name of ["Two\nLines", "Two\r\nLines", "Two\u2028Lines", "Tab\there"]) {
      expect(ok(name), JSON.stringify(name)).toBe(false);
    }
  });
});
