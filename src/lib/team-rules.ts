// Team rules shared by the site, the registration form and (later) the backend.
// Source of truth: docs/architecture.md, section 5 and decision D13.

export type CategoryId = "school" | "university" | "open";

export const TEAM_SIZE = { min: 1, max: 5 } as const;
