"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Lock, TriangleAlert, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmByTyping } from "@/components/ui/confirm-by-typing";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { finaliseShortlist, reopenShortlist, setShortlistMarks, type TeamRow } from "@/lib/data";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/team-rules";
import { cn } from "@/lib/utils";
import { useAdminSession } from "../admin-session";
import { StageBadge } from "../badges";
import { errorText } from "../errors";
import { formatDateTime, formatShortDay } from "../format";
import { PageHeader } from "../super-only";
import { useAdminData } from "../use-admin-data";
import { institutionLabel } from "../teams/teams-table";
import { candidatesOf, finalisePreview, plural, summarise } from "./shortlist-logic";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = CategoryId | "all";

/**
 * /admin/shortlist (super admins): tick the teams to shortlist, then finalise. Ticks are a draft
 * only super admins see; finalising publishes them, emails the newly shortlisted teams and locks
 * the ticks until the list is reopened.
 */
export function ShortlistScreen() {
  const { data, offline, retry } = useAdminData();
  const { actor } = useAdminSession();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [finaliseOpen, setFinaliseOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  const candidates = useMemo(() => (data ? candidatesOf(data.teams) : []), [data]);
  const shown = useMemo(() => candidates.filter((t) => filter === "all" || t.category === filter), [candidates, filter]);
  const summary = useMemo(() => summarise(candidates), [candidates]);
  const preview = useMemo(() => (data ? finalisePreview(data.teams) : null), [data]);

  if (!data || !preview) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Shortlist" />
        {offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the shortlist</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={retry}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the shortlist" className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const finalised = data.settings.shortlistState === "finalised";
  const latest = data.finalisations[0];
  const tickedTotal = preview.shortlisted;

  async function mark(ids: number[], on: boolean) {
    // Each change is its own call, so quick ticks in a row all go through
    if (!actor || ids.length === 0) return;
    try {
      const r = await setShortlistMarks(ids, on, actor);
      if (!r.ok) toast({ tone: "error", title: "Couldn't change the ticks", description: r.error.message });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't change the ticks", description: errorText(e) });
    }
  }

  const bulk = (on: boolean) => mark(shown.filter((t) => t.shortlistMark !== on).map((t) => t.id), on);

  async function finalise(): Promise<string | void> {
    if (!actor) return "You're signed out. Sign in again.";
    try {
      const r = await finaliseShortlist(actor, "FINALISE");
      if (!r.ok) return r.error.message;
      toast({
        tone: "success",
        title: "Shortlist finalised",
        description: `${plural(r.data.shortlistedCount, "team")} shortlisted, ${plural(r.data.newlyEmailedCount, "email")} sent.`,
      });
    } catch (e) {
      return errorText(e);
    }
  }

  async function reopen() {
    if (!actor || busy) return;
    setBusy(true);
    try {
      const r = await reopenShortlist(actor);
      if (r.ok) {
        setReopenOpen(false);
        toast({ tone: "info", title: "Shortlist reopened", description: "Teams keep their result until you finalise again." });
      } else {
        toast({ tone: "error", title: "Couldn't reopen", description: r.error.message });
      }
    } catch (e) {
      toast({ tone: "error", title: "Couldn't reopen", description: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shortlist"
        description="Tick the teams to take to the next round. Ticks are a draft only super admins can see until you finalise."
      />

      {finalised ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel bg-mint/10 p-4 ring-1 ring-mint/30 ring-inset">
          <p className="flex items-start gap-3 text-small text-foam">
            <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
            <span>
              <strong className="font-semibold">The shortlist is finalised.</strong>{" "}
              {latest ? `${formatDateTime(latest.finalisedAt)} by ${latest.finalisedByName}. ` : ""}The ticks are locked.
            </span>
          </p>
          <Button variant="secondary" size="sm" onClick={() => setReopenOpen(true)}>
            <Undo2 aria-hidden="true" className="size-4" />
            Reopen shortlist
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-panel bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/40 ring-inset">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            <strong className="font-semibold">Draft.</strong> Nothing is published and nobody is emailed until you finalise.
          </span>
        </div>
      )}

      {/* Sticky summary: counts per category and the finalise button */}
      <section
        aria-label="Summary"
        className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-panel border border-edge bg-night/95 p-4 backdrop-blur-sm"
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small">
          {summary.map((s) => (
            <li key={s.category}>
              <span className="text-haze">{CATEGORY_LABELS[s.category]} </span>
              <strong className="font-semibold text-foam tabular-nums">
                {s.ticked}
                <span className="font-normal text-haze"> of {s.total}</span>
              </strong>
            </li>
          ))}
          <li aria-live="polite">
            <span className="text-haze">Total </span>
            <strong className="font-semibold text-mint tabular-nums">{tickedTotal}</strong>
          </li>
        </ul>
        {!finalised && (
          <Button onClick={() => setFinaliseOpen(true)} disabled={tickedTotal === 0}>
            <CheckCheck aria-hidden="true" className="size-4" />
            Finalise shortlist
          </Button>
        )}
      </section>

      {candidates.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="Teams appear here once they submit a proposal. In development, switch the sample clock to a later stage or add teams."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Show category" className="flex flex-wrap gap-2">
              {(["all", "school", "university", "open"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-small font-semibold ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua",
                    filter === f ? "bg-mint/15 text-mint ring-mint/40" : "text-haze ring-edge hover:text-foam",
                  )}
                >
                  {f === "all" ? "All" : CATEGORY_LABELS[f]}
                </button>
              ))}
            </div>
            {!finalised && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => bulk(true)}>
                  Tick all shown
                </Button>
                <Button variant="ghost" size="sm" onClick={() => bulk(false)}>
                  Untick all shown
                </Button>
              </div>
            )}
          </div>

          <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
            <table className="w-full border-separate border-spacing-0 text-small">
              <caption className="sr-only">Teams with a proposal. Tick the ones to shortlist.</caption>
              <thead>
                <tr className="text-left text-haze">
                  <th scope="col" className="w-12 border-b border-edge bg-night px-2 py-2">
                    <span className="sr-only">Shortlist</span>
                  </th>
                  {["Team", "Category", "Institution", "Proposal", "Stage"].map((h) => (
                    <th key={h} scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <Row key={t.id} team={t} locked={finalised} onTick={(on) => mark([t.id], on)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data.finalisations.length > 0 && (
        <section aria-labelledby="history" className="flex flex-col gap-3">
          <h2 id="history" className="text-title font-semibold text-foam">
            Finalisation history
          </h2>
          <ul className="flex flex-col gap-2">
            {data.finalisations.map((f) => (
              <li key={f.id} className="rounded-control bg-deep/40 p-4 text-small ring-1 ring-edge ring-inset">
                <p className="font-semibold text-foam">{formatDateTime(f.finalisedAt)}</p>
                <p className="text-haze">
                  {f.finalisedByName} · {plural(f.shortlistedCount, "team")} shortlisted · {plural(f.newlyEmailedCount, "email")} sent
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmByTyping
        open={finaliseOpen}
        onOpenChange={setFinaliseOpen}
        word="FINALISE"
        title="Finalise the shortlist?"
        confirmLabel="Finalise shortlist"
        description={
          <span className="flex flex-col gap-2">
            <span>
              <strong className="font-semibold text-foam">{plural(preview.shortlisted, "team")}</strong> will be shortlisted and
              prototype submission opens for them.{" "}
              <strong className="font-semibold text-foam">{plural(preview.newlyEmailed, "team leader")}</strong>{" "}
              will be emailed{preview.shortlisted > preview.newlyEmailed ? " (teams emailed in an earlier round are not emailed again)" : ""}.
            </span>
            <span>
              The other {plural(preview.notShortlisted, "team")} will see “not shortlisted” in their portal. They are not emailed.
            </span>
            {preview.toldBeforeNowOut > 0 && (
              <span className="text-warning">
                {plural(preview.toldBeforeNowOut, "team")} {preview.toldBeforeNowOut === 1 ? "was" : "were"} told earlier that they were
                shortlisted and {preview.toldBeforeNowOut === 1 ? "is" : "are"} now unticked. They get no correction email.
              </span>
            )}
          </span>
        }
        onConfirm={finalise}
      />

      <Dialog
        open={reopenOpen}
        onOpenChange={(o) => !busy && setReopenOpen(o)}
        title="Reopen the shortlist?"
        description="Teams keep the result they were shown until you finalise again."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReopenOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={reopen} loading={busy}>
              Reopen shortlist
            </Button>
          </>
        }
      >
        <p className="text-small text-haze">The ticks become editable. Nobody is emailed until you finalise again.</p>
      </Dialog>
    </div>
  );
}

function Row({ team: t, locked, onTick }: { team: TeamRow; locked: boolean; onTick: (on: boolean) => void }) {
  return (
    <tr className={cn("hover:bg-foam/5", t.shortlistMark && "bg-mint/5")}>
      <td className="border-b border-edge/60 px-2">
        <Checkbox
          checked={t.shortlistMark}
          disabled={locked}
          onCheckedChange={onTick}
          aria-label={`Shortlist ${t.name}`}
        />
      </td>
      <td className="border-b border-edge/60 px-3 py-2 font-semibold whitespace-nowrap text-foam">
        {t.name}
        <span className="block font-mono text-caption font-normal text-haze">{t.code}</span>
      </td>
      <td className="border-b border-edge/60 px-3 whitespace-nowrap">{CATEGORY_LABELS[t.category]}</td>
      <td className="border-b border-edge/60 px-3">
        <span className="block max-w-56 truncate" title={institutionLabel(t)}>
          {institutionLabel(t)}
        </span>
      </td>
      <td className="border-b border-edge/60 px-3 whitespace-nowrap">
        {t.proposal ? (
          <>
            v{t.proposal.version}
            <span className="text-haze"> · {formatShortDay(t.proposal.submittedAt)}</span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="border-b border-edge/60 px-3 whitespace-nowrap">
        {t.shortlistMark && !locked ? <Badge tone="mint">Ticked</Badge> : <StageBadge stage={t.stage} />}
      </td>
    </tr>
  );
}
