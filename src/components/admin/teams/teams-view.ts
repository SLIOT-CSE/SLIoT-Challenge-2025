import type { TeamRow } from "@/lib/data";
import { TEAM_STAGES, type CategoryId, type TeamStage } from "@/lib/team-rules";

// What the Teams table shows: the filters people set, kept in the address so a filtered view
// can be bookmarked, shared and survives a refresh. No React in here.

export interface TeamsView {
  /** Matches team name, code, member name, email or NIC */
  q: string;
  category: CategoryId | "";
  stage: TeamStage | "";
  /** An institution's exact name, as listed in the filter */
  institution: string;
}

export const EMPTY_VIEW: TeamsView = { q: "", category: "", stage: "", institution: "" };

const CATEGORIES: readonly CategoryId[] = ["school", "university", "open"];

/** Reads the view from the address. Unknown values are ignored, never trusted */
export function parseView(params: { get(name: string): string | null }): TeamsView {
  const category = params.get("category") ?? "";
  const stage = params.get("stage") ?? "";
  return {
    q: (params.get("q") ?? "").slice(0, 100),
    category: (CATEGORIES as readonly string[]).includes(category) ? (category as CategoryId) : "",
    stage: (TEAM_STAGES as readonly string[]).includes(stage) ? (stage as TeamStage) : "",
    institution: (params.get("institution") ?? "").slice(0, 200),
  };
}

export function hasFilters(view: TeamsView): boolean {
  return Boolean(view.q.trim() || view.category || view.stage || view.institution);
}

/** The address query for a view, leaving out what is empty. Keeps `keep` (e.g. the open team) as it is */
export function viewToSearch(view: TeamsView, keep: { team?: string | null } = {}): string {
  const params = new URLSearchParams();
  if (view.q.trim()) params.set("q", view.q.trim());
  if (view.category) params.set("category", view.category);
  if (view.stage) params.set("stage", view.stage);
  if (view.institution) params.set("institution", view.institution);
  if (keep.team) params.set("team", keep.team);
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** Every institution a team names: its own, or in an Open team each member's */
export function institutionsOf(team: TeamRow): string[] {
  const names = new Set<string>();
  if (team.institutionName) names.add(team.institutionName);
  for (const m of team.members) if (m.institutionName) names.add(m.institutionName);
  return [...names];
}

/** The institution filter's choices: every name in the data, A to Z */
export function institutionOptions(teams: TeamRow[]): string[] {
  const names = new Set<string>();
  for (const t of teams) for (const name of institutionsOf(t)) names.add(name);
  return [...names].sort((a, b) => a.localeCompare(b, "en"));
}

/** The teams that pass every filter, in the order given */
export function filterTeams(teams: TeamRow[], view: TeamsView): TeamRow[] {
  const needle = view.q.trim().toLowerCase();
  return teams.filter((t) => {
    if (view.category && t.category !== view.category) return false;
    if (view.stage && t.stage !== view.stage) return false;
    if (view.institution && !institutionsOf(t).includes(view.institution)) return false;
    if (!needle) return true;
    return (
      t.name.toLowerCase().includes(needle) ||
      t.code.toLowerCase().includes(needle) ||
      t.members.some(
        (m) =>
          m.fullName.toLowerCase().includes(needle) ||
          m.email.toLowerCase().includes(needle) ||
          (m.nic?.toLowerCase().includes(needle) ?? false),
      )
    );
  });
}
