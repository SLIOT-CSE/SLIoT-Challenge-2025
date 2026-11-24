// Which columns the Teams table has, which show by default, and the person's choice saved in
// their browser. No React and no table library in here.

export type TeamColumnId =
  | "name"
  | "code"
  | "category"
  | "stage"
  | "institution"
  | "leader"
  | "leaderEmail"
  | "members"
  | "proposal"
  | "prototype"
  | "registered";

export interface TeamColumnConfig {
  id: TeamColumnId;
  label: string;
  /** The team's name is what you open the team by, so it can't be hidden */
  hideable: boolean;
  defaultVisible: boolean;
}

export const TEAM_COLUMNS: readonly TeamColumnConfig[] = [
  { id: "name", label: "Team", hideable: false, defaultVisible: true },
  { id: "code", label: "Code", hideable: true, defaultVisible: true },
  { id: "category", label: "Category", hideable: true, defaultVisible: true },
  { id: "stage", label: "Stage", hideable: true, defaultVisible: true },
  { id: "institution", label: "Institution", hideable: true, defaultVisible: true },
  { id: "leader", label: "Team leader", hideable: true, defaultVisible: false },
  { id: "leaderEmail", label: "Leader's email", hideable: true, defaultVisible: false },
  { id: "members", label: "Members", hideable: true, defaultVisible: true },
  { id: "proposal", label: "Proposal", hideable: true, defaultVisible: true },
  { id: "prototype", label: "Prototype", hideable: true, defaultVisible: true },
  { id: "registered", label: "Registered", hideable: true, defaultVisible: false },
];

/** TanStack's shape: only an explicit `false` hides a column */
export type ColumnVisibility = Record<string, boolean>;

export function defaultVisibility(): ColumnVisibility {
  return Object.fromEntries(TEAM_COLUMNS.map((c) => [c.id, c.defaultVisible]));
}

export const COLUMNS_STORAGE_KEY = "sliot-admin-teams-columns";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

/** Keeps known columns with true/false values and anything unreadable becomes the default */
export function sanitiseVisibility(raw: unknown): ColumnVisibility {
  const result = defaultVisibility();
  if (typeof raw !== "object" || raw === null) return result;
  for (const column of TEAM_COLUMNS) {
    const value = (raw as Record<string, unknown>)[column.id];
    if (column.hideable && typeof value === "boolean") result[column.id] = value;
  }
  return result;
}

/** Storage can be missing or blocked (private windows, blocked site data): fall back to the default */
export function loadVisibility(storage?: Storage): ColumnVisibility {
  try {
    const store = storage ?? window.localStorage;
    const json = store.getItem(COLUMNS_STORAGE_KEY);
    return sanitiseVisibility(json ? JSON.parse(json) : null);
  } catch {
    return defaultVisibility();
  }
}

export function saveVisibility(visibility: ColumnVisibility, storage?: Storage): void {
  try {
    (storage ?? window.localStorage).setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibility));
  } catch {
    // Not saved: the choice still applies until the page closes
  }
}
