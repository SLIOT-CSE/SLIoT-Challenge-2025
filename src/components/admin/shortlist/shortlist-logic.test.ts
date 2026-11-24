import { describe, expect, it } from "vitest";
import type { TeamRow } from "@/lib/data";
import { generateSampleState } from "@/lib/data/fixtures/sample-state";
import { candidatesOf, currentFinalists, finalisePreview, plural, readyForFinals, summarise } from "./shortlist-logic";

function rows(): TeamRow[] {
  const s = generateSampleState();
  return s.teams.map((t) => ({
    ...t,
    members: s.members.filter((m) => m.teamId === t.id),
    proposal: s.submissions.find((x) => x.teamId === t.id && x.kind === "proposal" && x.isCurrent) ?? null,
    prototype: s.submissions.find((x) => x.teamId === t.id && x.kind === "prototype" && x.isCurrent) ?? null,
  }));
}

describe("shortlist logic", () => {
  const all = rows();

  it("only teams with a proposal are candidates", () => {
    const c = candidatesOf(all);
    expect(c.length).toBeGreaterThan(0);
    expect(c.every((t) => t.proposal)).toBe(true);
    expect(c.length).toBe(all.filter((t) => t.stage !== "registered").length);
  });

  it("summarises ticks per category", () => {
    const s = summarise(candidatesOf(all));
    expect(s.map((x) => x.category)).toEqual(["school", "university", "open"]);
    expect(s.reduce((n, x) => n + x.total, 0)).toBe(candidatesOf(all).length);
    expect(s.reduce((n, x) => n + x.ticked, 0)).toBe(all.filter((t) => t.shortlistMark).length);
  });

  it("counts only newly shortlisted teams as emailed", () => {
    const base = finalisePreview(all);
    expect(base.newlyEmailed).toBe(0); // the sample teams were all emailed already
    const fresh = all.map((t) => (t.name === "Byte Fireflies" ? { ...t, shortlistMark: true } : t));
    const p = finalisePreview(fresh);
    expect(p.shortlisted).toBe(base.shortlisted + 1);
    expect(p.newlyEmailed).toBe(1);
    expect(p.shortlisted + p.notShortlisted).toBe(all.length);
  });

  it("warns about teams told they were shortlisted and now unticked", () => {
    const unticked = all.map((t) => (t.name === "Lanka Sensors" ? { ...t, shortlistMark: false } : t));
    expect(finalisePreview(unticked).toldBeforeNowOut).toBe(1);
    expect(finalisePreview(all).toldBeforeNowOut).toBe(0);
  });

  it("finalist lists split teams with a prototype by whether they were announced", () => {
    const ready = readyForFinals(all);
    const finalists = currentFinalists(all);
    expect(ready.every((t) => t.prototype && t.stage !== "finalist")).toBe(true);
    expect(finalists.map((t) => t.stage)).toEqual(finalists.map(() => "finalist"));
    expect(ready.map((t) => t.name)).toEqual(["Tiny Tinkerers"]);
    expect(finalists).toHaveLength(2);
  });

  it("pluralises", () => {
    expect(plural(1, "team")).toBe("1 team");
    expect(plural(0, "email")).toBe("0 emails");
  });
});
