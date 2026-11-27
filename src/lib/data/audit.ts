import type { AuditActionGroup } from "./types";

// Audit actions are named `<group>.<what>`. The groups drive the audit log's filter.
// Proposal and prototype uploads belong to "team": they are things a team did.

export const AUDIT_ACTION_GROUPS: readonly AuditActionGroup[] = [
  "team",
  "shortlist",
  "finalists",
  "admin",
  "settings",
  "export",
];

const PREFIX_GROUP: Record<string, AuditActionGroup> = {
  team: "team",
  proposal: "team",
  prototype: "team",
  email: "team",
  shortlist: "shortlist",
  finalists: "finalists",
  admin: "admin",
  settings: "settings",
  export: "export",
};

/** The filter group an action belongs to, or null for an action nobody grouped */
export function auditActionGroup(action: string): AuditActionGroup | null {
  return PREFIX_GROUP[action.split(".")[0]] ?? null;
}
