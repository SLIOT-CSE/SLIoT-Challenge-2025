// Team rules shared by the site, the registration form and (later) the backend.
// Source of truth: docs/architecture.md, section 5 and decision D13.

export type CategoryId = "school" | "university" | "open";

export const TEAM_SIZE = { min: 1, max: 5 } as const;

export type InstitutionType = "school" | "university";

/** One team's progress through the competition (docs/architecture.md, `teams.stage`) */
export const TEAM_STAGES = [
  "registered",
  "proposal_submitted",
  "shortlisted",
  "not_shortlisted",
  "prototype_submitted",
  "finalist",
] as const;

export type TeamStage = (typeof TEAM_STAGES)[number];

/** Plain-language names for the organizer screens and exports */
export const TEAM_STAGE_LABELS: Record<TeamStage, string> = {
  registered: "Registered",
  proposal_submitted: "Proposal submitted",
  shortlisted: "Shortlisted",
  not_shortlisted: "Not shortlisted",
  prototype_submitted: "Prototype submitted",
  finalist: "Finalist",
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  school: "School",
  university: "University",
  open: "Open",
};

export const SUBMISSION_KINDS = ["proposal", "prototype"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

/** Largest proposal PDF accepted */
export const MAX_PROPOSAL_BYTES = 10 * 1024 * 1024;
