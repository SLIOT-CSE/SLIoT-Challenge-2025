"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ScrollText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  AUDIT_ACTION_GROUPS,
  listAdmins,
  listAuditLog,
  dataVersion,
  type AdminAccount,
  type AuditActionGroup,
  type AuditEntryView,
} from "@/lib/data";
import { useAdminSession } from "../admin-session";
import { describeAudit } from "../describe-audit";
import { errorText } from "../errors";
import { formatDateTime } from "../format";
import { PageHeader } from "../super-only";
import {
  GROUP_LABELS,
  NO_CONTROLS,
  hasAuditFilters,
  rangeIsBackwards,
  toAuditFilter,
  type ActorChoice,
  type AuditControls,
} from "./audit-filter";

const PAGE = 100;

/** Who an entry is attributed to, in words */
function who(e: AuditEntryView): string {
  if (e.actorName) return e.actorName;
  if (e.actorType === "team") return "A team";
  if (e.actorType === "anonymous") return "A visitor";
  if (e.actorType === "system") return "The system";
  return "An organizer";
}

/**
 * /admin/audit (super admins): everything that has happened, newest first, in plain sentences.
 * Filter by who, what kind of action and the day (Sri Lanka time). 100 entries at a time.
 */
export function AuditScreen() {
  const { actor } = useAdminSession();
  const toast = useToast();
  const storeVersion = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);

  const [controls, setControls] = useState<AuditControls>(NO_CONTROLS);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [page, setPage] = useState<{ entries: AuditEntryView[]; hasMore: boolean } | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const backwards = rangeIsBackwards(controls);
  const filter = useMemo(() => toAuditFilter(controls), [controls]);

  useEffect(() => {
    if (!actor || backwards) return;
    let cancelled = false;
    Promise.all([listAuditLog(actor, { ...filter, limit: PAGE }), listAdmins(actor)])
      .then(([log, accounts]) => {
        if (cancelled) return;
        if (!log.ok) return setOffline(true);
        setPage(log.data);
        if (accounts.ok) setAdmins(accounts.data);
        setOffline(false);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, filter, backwards, storeVersion, reloadKey]);

  async function loadMore() {
    if (!actor || !page || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await listAuditLog(actor, { ...filter, limit: PAGE, offset: page.entries.length });
      if (r.ok) setPage({ entries: [...page.entries, ...r.data.entries], hasMore: r.data.hasMore });
      else toast({ tone: "error", title: "Couldn't load more", description: r.error.message });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't load more", description: errorText(e) });
    } finally {
      setLoadingMore(false);
    }
  }

  const set = (patch: Partial<AuditControls>) => setControls((c) => ({ ...c, ...patch }));

  const filters = (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <label className="col-span-2 flex flex-col gap-1 text-caption font-semibold text-haze sm:w-56">
        Who
        <Select value={controls.actor} onChange={(e) => set({ actor: e.target.value as ActorChoice })} className="h-11">
          <option value="any">Anyone</option>
          <option value="teams">Teams</option>
          <option value="visitors">Visitors (not signed in)</option>
          {admins.map((a) => (
            <option key={a.id} value={`admin:${a.id}`}>
              {a.displayName}
            </option>
          ))}
        </Select>
      </label>
      <label className="col-span-2 flex flex-col gap-1 text-caption font-semibold text-haze sm:w-52">
        What
        <Select value={controls.group} onChange={(e) => set({ group: e.target.value as AuditActionGroup | "" })} className="h-11">
          <option value="">Everything</option>
          {AUDIT_ACTION_GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-caption font-semibold text-haze">
        From
        <Input type="date" value={controls.fromDay} onChange={(e) => set({ fromDay: e.target.value })} className="h-11 [color-scheme:dark]" />
      </label>
      <label className="flex flex-col gap-1 text-caption font-semibold text-haze">
        To
        <Input type="date" value={controls.toDay} onChange={(e) => set({ toDay: e.target.value })} className="h-11 [color-scheme:dark]" />
      </label>
      {hasAuditFilters(controls) && (
        <Button variant="ghost" size="sm" className="col-span-2 sm:col-span-1" onClick={() => setControls(NO_CONTROLS)}>
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit log" description="Everything that has happened, newest first. Days are in Sri Lanka time." />
      {filters}

      {backwards ? (
        <EmptyState icon={<SearchX />} title="That date range is backwards" description="Choose a From day that is on or before the To day." />
      ) : !page ? (
        offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the audit log</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the audit log" className="flex flex-col gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )
      ) : page.entries.length === 0 ? (
        hasAuditFilters(controls) ? (
          <EmptyState
            icon={<SearchX />}
            title="Nothing matches"
            description="No entries match those filters."
            action={
              <Button variant="secondary" onClick={() => setControls(NO_CONTROLS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState icon={<ScrollText />} title="Nothing recorded yet" description="Actions by teams and organizers are listed here as they happen." />
        )
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
            <table className="w-full border-separate border-spacing-0 text-small">
              <caption className="sr-only">Audit log, newest first</caption>
              <thead>
                <tr className="text-left text-haze">
                  <th scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                    <span className="sm:hidden">When and who</span>
                    <span className="hidden sm:inline">When</span>
                  </th>
                  <th scope="col" className="hidden border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap sm:table-cell">
                    Who
                  </th>
                  <th scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                    What happened
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.entries.map((e) => {
                  const d = describeAudit(e);
                  return (
                    <tr key={e.id} className="align-top hover:bg-foam/5">
                      <td className="border-b border-edge/60 px-3 py-3 whitespace-nowrap text-haze">
                        {formatDateTime(e.createdAt)}
                        <span className="block text-foam sm:hidden">{who(e)}</span>
                      </td>
                      <td className="hidden border-b border-edge/60 px-3 py-3 whitespace-nowrap text-foam sm:table-cell">{who(e)}</td>
                      <td className="min-w-44 border-b border-edge/60 px-3 py-3 text-foam">
                        {d.text}
                        {d.detail.length > 0 && (
                          <ul className="mt-1 flex flex-col gap-0.5 text-caption text-haze">
                            {d.detail.map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-small text-haze">
            <p aria-live="polite">Showing {page.entries.length} {page.entries.length === 1 ? "entry" : "entries"}{page.hasMore ? ", more available" : ""}</p>
            {page.hasMore && (
              <Button variant="secondary" size="sm" onClick={loadMore} loading={loadingMore}>
                Load {PAGE} more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
