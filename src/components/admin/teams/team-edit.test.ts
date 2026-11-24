import { describe, expect, it } from "vitest";
import { generateSampleState } from "@/lib/data/fixtures/sample-state";
import type { TeamDetail } from "@/lib/data";
import { editErrors, isDirty, toEditInput, toFormValues } from "./team-edit";

function detailOf(name: string): TeamDetail {
  const s = generateSampleState();
  const t = s.teams.find((x) => x.name === name)!;
  return {
    ...t,
    members: s.members.filter((m) => m.teamId === t.id).sort((a, b) => a.position - b.position),
    proposal: null,
    prototype: null,
    submissions: [],
  };
}

describe("team edit form values", () => {
  it("starts valid and clean for a School team", () => {
    const team = detailOf("Wave Riders");
    const values = toFormValues(team);
    expect(values.category).toBe("school");
    expect(values.institutionName).toBe(team.institutionName);
    expect(editErrors(values)).toEqual({});
    expect(isDirty(values, values)).toBe(false);
  });

  it("keeps each member's own institution in an Open team", () => {
    const team = detailOf("Island Edge");
    const values = toFormValues(team);
    expect(values.members[0].institutionType).toBe(team.members[0].institutionType);
    expect(values.members[0].institutionName).toBe(team.members[0].institutionName);
    expect(editErrors(values)).toEqual({});
  });

  it("asks for a NIC only from university students", () => {
    const team = detailOf("Volt Voyagers");
    const values = toFormValues(team);
    expect(values.members.every((m) => m.nic !== "")).toBe(true);
    const cleared = { ...values, members: values.members.map((m, i) => (i === 0 ? { ...m, nic: "" } : m)) };
    expect(editErrors(cleared)["members.0.nic"]).toBeTruthy();
  });

  it("notices an edit and reports a bad one", () => {
    const values = toFormValues(detailOf("Wave Riders"));
    const edited = { ...values, name: "" };
    expect(isDirty(values, edited)).toBe(true);
    expect(editErrors(edited).name).toBeTruthy();
  });

  it("sends the same shape as registration without the category", () => {
    const input = toEditInput(toFormValues(detailOf("Wave Riders")));
    expect("category" in input).toBe(false);
    expect(input.members).toHaveLength(3);
    expect(input.name).toBe("Wave Riders");
  });
});
