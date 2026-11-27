import { describe, expect, it } from "vitest";
import type { AuditEntryView } from "@/lib/data";
import { describeAudit, fieldLabel } from "./describe-audit";

const entry = (over: Partial<AuditEntryView>): AuditEntryView => ({
  id: 1,
  actorType: "admin",
  actorId: 2,
  actorName: "Sample Admin One",
  action: "team.edited",
  targetType: "team",
  targetId: "5",
  details: null,
  createdAt: 0,
  ...over,
});

describe("fieldLabel", () => {
  it("names team and member fields in words", () => {
    expect(fieldLabel("name")).toBe("Team name");
    expect(fieldLabel("member2.email")).toBe("Member 2 email");
    expect(fieldLabel("member3.whatsapp")).toBe("Member 3 WhatsApp number");
    expect(fieldLabel("member1.institutionName")).toBe("Member 1 institution name");
    expect(fieldLabel("proposalDue")).toBe("Proposals due");
  });

  it("falls back to the raw field", () => {
    expect(fieldLabel("mystery")).toBe("mystery");
  });
});

describe("describeAudit", () => {
  it("lists each change in an edit", () => {
    const d = describeAudit(
      entry({ details: { changes: [{ field: "name", from: "Wave Riders", to: "Wave Runners" }, { field: "member2.nic", from: null, to: "200012345678" }] } }),
    );
    expect(d.text).toBe("Sample Admin One edited the team's details");
    expect(d.detail).toEqual(["Team name: “Wave Riders” → “Wave Runners”", "Member 2 NIC: empty → “200012345678”"]);
  });

  it("names a team that acted as 'The team'", () => {
    expect(describeAudit(entry({ actorType: "team", actorName: null, action: "proposal.uploaded", details: { version: 2 } })).text).toBe(
      "The team uploaded proposal version 2",
    );
  });

  it("says who is unknown", () => {
    expect(describeAudit(entry({ actorType: "anonymous", actorName: null, action: "team.registered" })).text).toBe("The team registered");
  });

  it("counts correctly in the singular and plural", () => {
    const one = describeAudit(entry({ action: "finalists.announced", details: { count: 1, newlyEmailedCount: 1 } }));
    expect(one.text).toBe("Sample Admin One announced 1 finalist, 1 email sent");
    const many = describeAudit(entry({ action: "shortlist.marked", details: { marked: false, count: 3 } }));
    expect(many.text).toBe("Sample Admin One unticked 3 teams on the draft shortlist");
  });

  it("describes deadline changes", () => {
    const d = describeAudit(entry({ action: "settings.updated", details: { changes: [{ field: "proposalDue", from: "a", to: "b" }] } }));
    expect(d.detail).toEqual(["Proposals due: “a” → “b”"]);
  });

  it("never returns an empty sentence for an unknown action", () => {
    expect(describeAudit(entry({ action: "mystery.thing" })).text).toBe("Sample Admin One: mystery.thing");
  });

  it("copes with missing details", () => {
    expect(describeAudit(entry({ action: "export.csv", details: null })).text).toBe("Sample Admin One downloaded a CSV of 0 teams");
    expect(describeAudit(entry({ action: "team.edited", details: null })).detail).toEqual([]);
  });
});
