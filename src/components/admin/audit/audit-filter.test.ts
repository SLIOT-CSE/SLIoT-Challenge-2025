import { describe, expect, it } from "vitest";
import { NO_CONTROLS, dayEndMs, dayStartMs, hasAuditFilters, rangeIsBackwards, toAuditFilter } from "./audit-filter";

describe("audit filter", () => {
  it("asks for everything by default", () => {
    expect(toAuditFilter(NO_CONTROLS)).toEqual({});
    expect(hasAuditFilters(NO_CONTROLS)).toBe(false);
  });

  it("maps who did it", () => {
    expect(toAuditFilter({ ...NO_CONTROLS, actor: "teams" })).toEqual({ actorType: "team" });
    expect(toAuditFilter({ ...NO_CONTROLS, actor: "visitors" })).toEqual({ actorType: "anonymous" });
    expect(toAuditFilter({ ...NO_CONTROLS, actor: "admin:2" })).toEqual({ actorType: "admin", actorId: 2 });
  });

  it("maps the action group", () => {
    expect(toAuditFilter({ ...NO_CONTROLS, group: "export" })).toEqual({ actionGroup: "export" });
  });

  it("treats days as Sri Lanka days, whole from start to end", () => {
    expect(dayStartMs("2027-03-15")).toBe(Date.parse("2027-03-14T18:30:00Z"));
    expect(dayEndMs("2027-03-15")).toBe(Date.parse("2027-03-15T18:29:59.999Z"));
    const f = toAuditFilter({ ...NO_CONTROLS, fromDay: "2027-03-15", toDay: "2027-03-15" });
    expect(f.to! - f.from!).toBe(24 * 3600 * 1000 - 1);
  });

  it("ignores a bad day", () => {
    expect(dayStartMs("15/03/2027")).toBeUndefined();
    expect(toAuditFilter({ ...NO_CONTROLS, fromDay: "nope" })).toEqual({});
  });

  it("notices a backwards range", () => {
    expect(rangeIsBackwards({ ...NO_CONTROLS, fromDay: "2027-04-02", toDay: "2027-04-01" })).toBe(true);
    expect(rangeIsBackwards({ ...NO_CONTROLS, fromDay: "2027-04-01", toDay: "2027-04-01" })).toBe(false);
    expect(rangeIsBackwards(NO_CONTROLS)).toBe(false);
  });
});
