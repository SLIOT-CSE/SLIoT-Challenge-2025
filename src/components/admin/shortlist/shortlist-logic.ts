import type { TeamRow } from "@/lib/data";
import type { CategoryId } from "@/lib/team-rules";

// What the Shortlist screen counts and promises, with no React in it.

/** Only teams that sent a proposal can be ticked */
export const candidatesOf = (teams: TeamRow[]): TeamRow[] => teams.filter((t) => t.proposal !== null);

export interface CategorySummary {
  category: CategoryId;
  ticked: number;
  total: number;
}

const CATEGORY_ORDER: readonly CategoryId[] = ["school", "university", "open"];

export function summarise(candidates: TeamRow[]): CategorySummary[] {
  return CATEGORY_ORDER.map((category) => {
    const inCategory = candidates.filter((t) => t.category === category);
    return { category, ticked: inCategory.filter((t) => t.shortlistMark).length, total: inCategory.length };
  });
}

export interface FinalisePreview {
  /** Teams that will be shortlisted */
  shortlisted: number;
  /** Of those, the ones not emailed before: only they get the email */
  newlyEmailed: number;
  /** Every other team is marked not shortlisted (told in the portal, not by email) */
  notShortlisted: number;
  /** Unticked teams that were told they were shortlisted in an earlier round. They get no correction email */
  toldBeforeNowOut: number;
}

export function finalisePreview(teams: TeamRow[]): FinalisePreview {
  const ticked = teams.filter((t) => t.shortlistMark);
  return {
    shortlisted: ticked.length,
    newlyEmailed: ticked.filter((t) => t.shortlistEmailedAt === null).length,
    notShortlisted: teams.length - ticked.length,
    toldBeforeNowOut: teams.filter((t) => !t.shortlistMark && t.shortlistEmailedAt !== null).length,
  };
}

/**
 * Teams that can be announced as finalists: shortlisted, prototype in, not yet announced. That is
 * exactly stage "prototype_submitted"; a team that was shortlisted out never shows here.
 */
export const readyForFinals = (teams: TeamRow[]): TeamRow[] =>
  teams.filter((t) => t.stage === "prototype_submitted" && t.prototype !== null);

export const currentFinalists = (teams: TeamRow[]): TeamRow[] => teams.filter((t) => t.stage === "finalist");

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;
