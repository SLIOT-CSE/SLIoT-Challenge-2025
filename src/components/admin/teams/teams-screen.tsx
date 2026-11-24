"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, SearchX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  NetworkError,
  exportTeamsCsv,
  exportToSheets,
  getSettings,
  listTeams,
  store,
  type TeamRow,
} from "@/lib/data";
import { CATEGORY_LABELS, TEAM_STAGES, TEAM_STAGE_LABELS, type CategoryId, type TeamStage } from "@/lib/team-rules";
import { useAdminSession } from "../admin-session";
import { downloadTextFile } from "../download";
import { formatDateTime } from "../format";
import { PageHeader } from "../super-only";
import { ColumnPicker } from "./column-picker";
import { defaultVisibility, loadVisibility, saveVisibility, type ColumnVisibility } from "./columns-config";
import { TeamDrawer } from "./team-drawer";
import { TeamsTable, TeamsTableSkeleton, useTeamsTable } from "./teams-table";
import { EMPTY_VIEW, filterTeams, hasFilters, institutionOptions, parseView, viewToSearch, type TeamsView } from "./teams-view";

const NETWORK_TEXT = "We couldn't reach the server. Check your connection and try again.";
const SEARCH_DELAY_MS = 250;

/**
 * /admin: every team in one table. Filters live in the address (so a view can be bookmarked),
 * the open team is `?team=<code>`, and the column choice is saved in this browser.
 */
export function TeamsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { actor } = useAdminSession();

  const urlView = useMemo(() => parseView(params), [params]);
  const teamCode = params.get("team");

  // The search box answers each keystroke at once; the address follows a moment later
  const [q, setQ] = useState(urlView.q);
  const view: TeamsView = useMemo(() => ({ ...urlView, q }), [urlView, q]);

  const [teams, setTeams] = useState<TeamRow[] | null>(null);
  const [lastSheetExportAt, setLastSheetExportAt] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTeams(), getSettings()])
      .then(([rows, settings]) => {
        if (cancelled) return;
        setTeams(rows);
        setLastSheetExportAt(settings.lastSheetExportAt);
        setOffline(false);
      })
      .catch(() => {
        // A failed refresh keeps the table as it is; only a failed first load shows the error
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey]);

  // ---- The address ----

  const go = useCallback(
    (next: TeamsView, team: string | null, mode: "push" | "replace") => {
      const url = `${pathname}${viewToSearch(next, { team })}`;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (q.trim() === urlView.q.trim()) return;
    const timer = setTimeout(() => go({ ...urlView, q }, teamCode, "replace"), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [q, urlView, teamCode, go]);

  // A filter changed a moment ago may not be in the address yet. Build on it, not on a stale
  // view, or two quick changes would undo each other.
  const pendingView = useRef<TeamsView | null>(null);
  useEffect(() => {
    pendingView.current = null;
  }, [urlView]);

  const setFilter = (patch: Partial<TeamsView>) => {
    const next = { ...(pendingView.current ?? view), ...patch };
    pendingView.current = next;
    go(next, teamCode, "replace");
  };

  const clearFilters = () => {
    setQ("");
    pendingView.current = EMPTY_VIEW;
    go(EMPTY_VIEW, teamCode, "replace");
  };

  // ---- Columns ----

  const [visibility, setVisibility] = useState<ColumnVisibility>(() =>
    typeof window === "undefined" ? defaultVisibility() : loadVisibility(),
  );
  const changeVisibility = (next: ColumnVisibility) => {
    setVisibility(next);
    saveVisibility(next);
  };

  // ---- Rows ----

  const filtered = useMemo(() => (teams ? filterTeams(teams, view) : []), [teams, view]);
  const institutions = useMemo(() => {
    const names = teams ? institutionOptions(teams) : [];
    // A stale address can name an institution nobody has; keep it so the select still shows it
    return view.institution && !names.includes(view.institution) ? [view.institution, ...names] : names;
  }, [teams, view.institution]);

  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const toggleExpanded = (teamId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(teamId)) next.add(teamId);
      return next;
    });

  // The table's columns need a stable opener, but it must always use the current address
  const openRef = useRef<(team: TeamRow) => void>(() => undefined);
  useEffect(() => {
    openRef.current = (team) => go(view, team.code, "push");
  }, [go, view]);
  const onOpen = useCallback((team: TeamRow) => openRef.current(team), []);

  const table = useTeamsTable({ data: filtered, columnVisibility: visibility, onOpen });

  const selected = teamCode && teams ? (teams.find((t) => t.code === teamCode) ?? null) : null;

  // ---- Exports ----

  const [busy, setBusy] = useState<"csv" | "sheets" | null>(null);

  async function downloadCsv() {
    if (!actor || busy) return;
    setBusy("csv");
    try {
      // The teams as the table shows them now: filtered, in the sorted order
      const ids = table.getRowModel().rows.map((r) => r.original.id);
      const result = await exportTeamsCsv(ids, actor);
      if (!result.ok) return toast({ tone: "error", title: "Couldn't export", description: result.error.message });
      downloadTextFile(result.data.csv, result.data.fileName);
      toast({ tone: "success", title: "CSV downloaded", description: `${result.data.count} teams in ${result.data.fileName}` });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't export", description: e instanceof NetworkError ? NETWORK_TEXT : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  async function sendToSheets() {
    if (!actor || busy) return;
    setBusy("sheets");
    try {
      const result = await exportToSheets(actor);
      if (!result.ok) return toast({ tone: "error", title: "Couldn't export", description: result.error.message });
      setLastSheetExportAt(result.data.exportedAt);
      toast({ tone: "success", title: "Exported to Google Sheets", description: `${result.data.count} teams. Sample data: nothing was sent.` });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't export", description: e instanceof NetworkError ? NETWORK_TEXT : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  // ---- Render ----

  const heading = (
    <PageHeader
      title="Teams"
      description="Every registered team. Open one to see its details, fix a typo or send its code again."
      actions={
        teams && (
          <>
            <Button variant="secondary" size="sm" onClick={downloadCsv} loading={busy === "csv"} disabled={busy === "sheets" || filtered.length === 0}>
              <Download aria-hidden="true" className="size-4" />
              {hasFilters(view) ? `Download CSV (${filtered.length})` : "Download CSV"}
            </Button>
            <Button variant="secondary" size="sm" onClick={sendToSheets} loading={busy === "sheets"} disabled={busy === "csv"}>
              <FileSpreadsheet aria-hidden="true" className="size-4" />
              Export to Sheets
            </Button>
          </>
        )
      }
    />
  );

  if (!teams) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        {offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the teams</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          </div>
        ) : (
          <TeamsTableSkeleton />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {heading}

      {teams.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No teams yet"
          description="Teams show up here as they register. In development, use “Add teams” in the sample panel to fill the table."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <label className="col-span-2 flex flex-col sm:min-w-56 sm:flex-1 gap-1 text-caption font-semibold text-haze">
              Search
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Team, code, member, email or NIC"
                className="h-11"
                autoComplete="off"
              />
            </label>
            <FilterSelect label="Category" value={view.category} onChange={(v) => setFilter({ category: v as CategoryId | "" })}>
              <option value="">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Stage" value={view.stage} onChange={(v) => setFilter({ stage: v as TeamStage | "" })}>
              <option value="">All stages</option>
              {TEAM_STAGES.map((s) => (
                <option key={s} value={s}>
                  {TEAM_STAGE_LABELS[s]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Institution" value={view.institution} onChange={(v) => setFilter({ institution: v })} wide>
              <option value="">All institutions</option>
              {institutions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </FilterSelect>
            <div className="col-span-2 sm:col-span-1">
              <ColumnPicker visibility={visibility} onChange={changeVisibility} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-small text-haze">
            <p aria-live="polite">
              Showing <strong className="font-semibold text-foam">{filtered.length}</strong> of {teams.length} teams
              {hasFilters(view) && (
                <>
                  {" · "}
                  <button type="button" onClick={clearFilters} className="font-semibold text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint">
                    Clear filters
                  </button>
                </>
              )}
            </p>
            <p>{lastSheetExportAt ? `Last exported to Sheets ${formatDateTime(lastSheetExportAt)}` : "Not exported to Sheets yet"}</p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No teams match"
              description="Nothing matches that search and those filters. Try fewer filters, or search by a team code."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <TeamsTable table={table} expanded={expanded} onToggle={toggleExpanded} />
          )}
        </>
      )}

      <TeamDrawer team={selected} onClose={() => go(view, null, "replace")} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  wide,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-caption font-semibold text-haze ${wide ? "col-span-2 sm:w-60" : "sm:w-44"}`}>
      {label}
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-11">
        {children}
      </Select>
    </label>
  );
}
