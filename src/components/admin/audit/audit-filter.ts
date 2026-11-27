import type { AuditActionGroup, AuditFilter } from "@/lib/data";

// The Audit log's filter controls and what they ask the data layer for. No React in here.

export const GROUP_LABELS: Record<AuditActionGroup, string> = {
  team: "Team activity",
  shortlist: "Shortlist",
  finalists: "Finalists",
  admin: "Organizer accounts",
  settings: "Settings",
  export: "Exports",
};

/** Who did it: anyone, teams, visitors who weren't signed in, or one organizer */
export type ActorChoice = "any" | "teams" | "visitors" | `admin:${number}`;

export interface AuditControls {
  actor: ActorChoice;
  group: AuditActionGroup | "";
  /** `YYYY-MM-DD` in Sri Lanka time, or "" */
  fromDay: string;
  toDay: string;
}

export const NO_CONTROLS: AuditControls = { actor: "any", group: "", fromDay: "", toDay: "" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The first moment of a Sri Lanka day */
export const dayStartMs = (day: string): number | undefined =>
  DAY.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00+05:30`)) ? Date.parse(`${day}T00:00:00+05:30`) : undefined;

/** The last moment of a Sri Lanka day */
export const dayEndMs = (day: string): number | undefined =>
  DAY.test(day) && !Number.isNaN(Date.parse(`${day}T23:59:59.999+05:30`)) ? Date.parse(`${day}T23:59:59.999+05:30`) : undefined;

export function toAuditFilter(c: AuditControls): AuditFilter {
  const filter: AuditFilter = {};
  if (c.actor === "teams") filter.actorType = "team";
  else if (c.actor === "visitors") filter.actorType = "anonymous";
  else if (c.actor.startsWith("admin:")) {
    filter.actorType = "admin";
    filter.actorId = Number(c.actor.slice(6));
  }
  if (c.group) filter.actionGroup = c.group;
  const from = dayStartMs(c.fromDay);
  const to = dayEndMs(c.toDay);
  if (from !== undefined) filter.from = from;
  if (to !== undefined) filter.to = to;
  return filter;
}

export const hasAuditFilters = (c: AuditControls): boolean =>
  c.actor !== "any" || c.group !== "" || c.fromDay !== "" || c.toDay !== "";

/** From after To can't match anything: say so instead of showing an empty list */
export const rangeIsBackwards = (c: AuditControls): boolean => {
  const from = dayStartMs(c.fromDay);
  const to = dayEndMs(c.toDay);
  return from !== undefined && to !== undefined && from > to;
};
