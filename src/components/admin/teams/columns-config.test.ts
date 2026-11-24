import { describe, expect, it } from "vitest";
import {
  COLUMNS_STORAGE_KEY,
  TEAM_COLUMNS,
  defaultVisibility,
  loadVisibility,
  sanitiseVisibility,
  saveVisibility,
} from "./columns-config";

function fakeStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(COLUMNS_STORAGE_KEY, initial);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("column visibility", () => {
  it("starts with the default columns", () => {
    const v = defaultVisibility();
    expect(v.name).toBe(true);
    expect(v.leaderEmail).toBe(false);
    expect(Object.keys(v)).toHaveLength(TEAM_COLUMNS.length);
  });

  it("round-trips through storage", () => {
    const storage = fakeStorage();
    saveVisibility({ ...defaultVisibility(), code: false, leader: true }, storage);
    const loaded = loadVisibility(storage);
    expect(loaded.code).toBe(false);
    expect(loaded.leader).toBe(true);
  });

  it("never hides the team name", () => {
    expect(sanitiseVisibility({ name: false }).name).toBe(true);
  });

  it("ignores unknown columns and wrong types", () => {
    const v = sanitiseVisibility({ stage: "no", nothing: false, code: false });
    expect(v.stage).toBe(true);
    expect(v.code).toBe(false);
    expect("nothing" in v).toBe(false);
  });

  it("falls back to the default for unreadable storage", () => {
    expect(loadVisibility(fakeStorage("{not json"))).toEqual(defaultVisibility());
    expect(loadVisibility(fakeStorage("null"))).toEqual(defaultVisibility());
  });

  it("copes with storage that throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadVisibility(blocked)).toEqual(defaultVisibility());
    expect(() => saveVisibility(defaultVisibility(), blocked)).not.toThrow();
  });
});
