import { describe, expect, it } from "vitest";
import { generateSampleState } from "@/lib/data/sample";
import type { TeamRow } from "@/lib/data";
import { EMPTY_VIEW, filterTeams, hasFilters, institutionOptions, institutionsOf, parseView, viewToSearch } from "./teams-view";

function rows(): TeamRow[] {
  const s = generateSampleState();
  return s.teams.map((t) => ({
    ...t,
    members: s.members.filter((m) => m.teamId === t.id).sort((a, b) => a.position - b.position),
    proposal: null,
    prototype: null,
  }));
}

const params = (query: string) => new URLSearchParams(query);

describe("parseView", () => {
  it("reads filters from the address", () => {
    expect(parseView(params("q=wave&category=school&stage=shortlisted&institution=Central%20College%2C%20Kandy"))).toEqual({
      q: "wave",
      category: "school",
      stage: "shortlisted",
      institution: "Central College, Kandy",
    });
  });

  it("ignores values it doesn't know", () => {
    expect(parseView(params("category=robots&stage=winner"))).toEqual(EMPTY_VIEW);
  });

  it("caps the search length", () => {
    expect(parseView(params(`q=${"a".repeat(500)}`)).q).toHaveLength(100);
  });
});

describe("viewToSearch", () => {
  it("leaves out what is empty", () => {
    expect(viewToSearch(EMPTY_VIEW)).toBe("");
    expect(viewToSearch({ ...EMPTY_VIEW, category: "open" })).toBe("?category=open");
  });

  it("round-trips through parseView", () => {
    const view = { q: "ayesha", category: "university", stage: "finalist", institution: "University of Moratuwa" } as const;
    expect(parseView(params(viewToSearch(view)))).toEqual(view);
  });

  it("keeps the open team", () => {
    expect(viewToSearch({ ...EMPTY_VIEW, q: "x" }, { team: "SL27-AAAA-BBBB" })).toBe("?q=x&team=SL27-AAAA-BBBB");
  });
});

describe("filterTeams", () => {
  const all = rows();

  it("returns every team for an empty view", () => {
    expect(filterTeams(all, EMPTY_VIEW)).toHaveLength(all.length);
    expect(hasFilters(EMPTY_VIEW)).toBe(false);
  });

  it("filters by category and stage together", () => {
    const result = filterTeams(all, { ...EMPTY_VIEW, category: "university", stage: "finalist" });
    expect(result.map((t) => t.name)).toEqual(["Ohm Sweet Ohm"]);
  });

  it("searches team name and code, ignoring case", () => {
    expect(filterTeams(all, { ...EMPTY_VIEW, q: "WAVE RIDERS" }).map((t) => t.name)).toEqual(["Wave Riders"]);
    const code = all[3].code;
    expect(filterTeams(all, { ...EMPTY_VIEW, q: code.toLowerCase() })).toHaveLength(1);
  });

  it("searches member name, email and NIC", () => {
    const withNic = all.find((t) => t.members.some((m) => m.nic))!;
    const member = withNic.members.find((m) => m.nic)!;
    expect(filterTeams(all, { ...EMPTY_VIEW, q: member.fullName }).map((t) => t.id)).toContain(withNic.id);
    expect(filterTeams(all, { ...EMPTY_VIEW, q: member.email }).map((t) => t.id)).toContain(withNic.id);
    expect(filterTeams(all, { ...EMPTY_VIEW, q: member.nic! }).map((t) => t.id)).toContain(withNic.id);
  });

  it("finds an Open team by a member's institution", () => {
    const open = all.find((t) => t.category === "open")!;
    expect(open.institutionName).toBeNull();
    const name = open.members[0].institutionName;
    expect(filterTeams(all, { ...EMPTY_VIEW, institution: name }).map((t) => t.id)).toContain(open.id);
  });

  it("returns nothing for a search that matches nobody", () => {
    expect(filterTeams(all, { ...EMPTY_VIEW, q: "zzzz-nobody" })).toEqual([]);
  });
});

describe("institutions", () => {
  const all = rows();

  it("lists each institution once, A to Z", () => {
    const options = institutionOptions(all);
    expect(new Set(options).size).toBe(options.length);
    expect(options).toEqual([...options].sort((a, b) => a.localeCompare(b, "en")));
  });

  it("includes the institutions of an Open team's members", () => {
    const open = all.find((t) => t.category === "open")!;
    for (const name of institutionsOf(open)) expect(institutionOptions(all)).toContain(name);
  });
});
