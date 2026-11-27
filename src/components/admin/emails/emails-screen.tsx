"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MailCheck, RefreshCw, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { dataVersion, listOutbox, retryEmails, type OutboxEmail } from "@/lib/data";
import { useAdminSession } from "../admin-session";
import { errorText } from "../errors";
import { formatDateTime } from "../format";
import { PageHeader } from "../super-only";
import { EMAIL_VIEWS, TEMPLATE_LABELS, failedIds, searchEmails, statusLabel, type EmailView } from "./emails-view";

const PAGE = 100;

/**
 * /admin/emails (every organizer): emails that failed or are waiting, with the reason, and a
 * way to send them again. Sent ones can be looked up too.
 */
export function EmailsScreen() {
  const { actor } = useAdminSession();
  const toast = useToast();
  const storeVersion = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);

  const [emails, setEmails] = useState<OutboxEmail[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<EmailView>("unsent");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  /** The ids being queued, so their buttons wait */
  const [busy, setBusy] = useState<number[]>([]);

  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    listOutbox()
      .then((list) => {
        if (cancelled) return;
        setEmails(list);
        setOffline(false);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, storeVersion, reloadKey]);

  async function retry(ids: number[]) {
    if (!actor || busy.length > 0) return;
    setBusy(ids);
    try {
      const r = await retryEmails(ids, actor);
      if (r.ok) {
        const one = r.data.count === 1;
        toast({
          tone: "success",
          title: one ? "1 email queued" : `${r.data.count} emails queued`,
          description: "Sending starts within a few seconds. Refresh to see the result.",
        });
      } else {
        toast({ tone: "error", title: "Couldn't send again", description: r.error.message });
        setReloadKey((k) => k + 1);
      }
    } catch (e) {
      toast({ tone: "error", title: "Couldn't send again", description: errorText(e) });
    } finally {
      setBusy([]);
    }
  }

  const failed = emails ? failedIds(emails) : [];
  const matches = emails ? searchEmails(emails, view, search) : [];
  const shown = matches.slice(0, limit);
  const th = "border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap";
  const td = "border-b border-edge/60 px-3 py-3";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Emails"
        description="Failed emails stay here until someone sends them again. An email goes to the address it was first queued for: if that was wrong, correct it under Teams and resend the team code."
        actions={
          <>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Refresh
            </Button>
            {failed.length > 0 && (
              <Button size="sm" onClick={() => retry(failed)} loading={busy.length > 1} disabled={busy.length > 0}>
                Retry all failed ({failed.length})
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-caption font-semibold text-haze sm:w-44">
          Show
          <Select
            value={view}
            onChange={(e) => {
              setView(e.target.value as EmailView);
              setLimit(PAGE);
            }}
            className="h-11"
          >
            {EMAIL_VIEWS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-caption font-semibold text-haze sm:w-72">
          Search team or address
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11" />
        </label>
      </div>

      {offline && emails && (
        <p role="alert" className="text-small text-warning">
          We couldn&apos;t refresh the list. Check your connection and try again.
        </p>
      )}

      {!emails ? (
        offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the emails</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the emails" className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )
      ) : matches.length === 0 ? (
        view === "unsent" && !search.trim() ? (
          <EmptyState icon={<MailCheck />} title="Every email has been sent" description="Anything that fails or is waiting shows up here." />
        ) : (
          <EmptyState icon={<SearchX />} title="Nothing matches" description="No emails match that view and search." />
        )
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
            <table className="w-full border-separate border-spacing-0 text-small">
              <caption className="sr-only">Emails, newest first</caption>
              <thead>
                <tr className="text-left text-haze">
                  <th scope="col" className={th}>Email</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={`${th} hidden md:table-cell`}>Queued</th>
                  <th scope="col" className={`${th} hidden sm:table-cell`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => {
                  const status = statusLabel(e);
                  const team = e.props.teamName ?? "No team";
                  const again = e.status !== "sent" && (
                    <Button variant="secondary" size="sm" onClick={() => retry([e.id])} loading={busy.length === 1 && busy[0] === e.id} disabled={busy.length > 0}>
                      Retry<span className="sr-only"> the {TEMPLATE_LABELS[e.template]} email to {team}</span>
                    </Button>
                  );
                  return (
                    <tr key={e.id} className="align-top hover:bg-foam/5">
                      <td className={`${td} min-w-40`}>
                        <span className="block font-semibold text-foam">{team}</span>
                        <span className="block text-haze">{TEMPLATE_LABELS[e.template]}</span>
                        <span className="block text-caption break-all text-haze">{e.toEmail}</span>
                        {e.lastError && <span className="mt-1 block max-w-prose text-caption break-words text-warning">{e.lastError}</span>}
                        {/* Phones have no room for a third column, so the button sits with the details */}
                        {again && <span className="mt-3 block sm:hidden">{again}</span>}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <Badge tone={status.tone}>{status.text}</Badge>
                        {e.attempts > 0 && e.status !== "sent" && (
                          <span className="mt-1 block text-caption text-haze">
                            {e.attempts} {e.attempts === 1 ? "try" : "tries"}
                          </span>
                        )}
                      </td>
                      <td className={`${td} hidden whitespace-nowrap text-haze md:table-cell`}>{formatDateTime(e.createdAt)}</td>
                      <td className={`${td} hidden text-right sm:table-cell`}>{again}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-small text-haze">
            <p aria-live="polite">
              Showing {shown.length} of {matches.length} {matches.length === 1 ? "email" : "emails"}
            </p>
            {matches.length > shown.length && (
              <Button variant="secondary" size="sm" onClick={() => setLimit((n) => n + PAGE)}>
                Show {PAGE} more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
