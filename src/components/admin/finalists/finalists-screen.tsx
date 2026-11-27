"use client";

import { useMemo, useState } from "react";
import { Megaphone, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmByTyping } from "@/components/ui/confirm-by-typing";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { announceFinalists, unmarkFinalists, type TeamRow } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/team-rules";
import { useAdminSession } from "../admin-session";
import { errorText } from "../errors";
import { formatShortDay } from "../format";
import { PageHeader } from "../super-only";
import { institutionLabel } from "../teams/teams-table";
import { currentFinalists, plural, readyForFinals } from "../shortlist/shortlist-logic";
import { useAdminData } from "../use-admin-data";

/**
 * /admin/finalists (super admins): tick the teams whose prototype is in and announce them as
 * finalists, with no draft step. Newly announced leaders are emailed once. A mistake is undone
 * by removing the team, which sends nothing.
 */
export function FinalistsScreen() {
  const { data, offline, retry } = useAdminData();
  const { actor } = useAdminSession();
  const toast = useToast();
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamRow | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = useMemo(() => (data ? readyForFinals(data.teams) : []), [data]);
  const finalists = useMemo(() => (data ? currentFinalists(data.teams) : []), [data]);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Finalists" />
        {offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the finalists</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={retry}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the finalists" className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Ticks only count for teams that are still ready (a team announced elsewhere drops out)
  const readyIds = new Set(ready.map((t) => t.id));
  const chosen = ready.filter((t) => picked.has(t.id));
  const allTicked = ready.length > 0 && chosen.length === ready.length;
  const newlyEmailed = chosen.filter((t) => t.finalistEmailedAt === null).length;

  const toggle = (id: number, on: boolean) =>
    setPicked((prev) => {
      const next = new Set([...prev].filter((x) => readyIds.has(x)));
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  async function announce(): Promise<string | void> {
    if (!actor) return "You're signed out. Sign in again.";
    try {
      const r = await announceFinalists(
        chosen.map((t) => t.id),
        actor,
        "FINALISTS",
      );
      if (!r.ok) return r.error.message;
      setPicked(new Set());
      toast({
        tone: "success",
        title: "Finalists announced",
        description: `${plural(r.data.count, "team")} are finalists, ${plural(r.data.newlyEmailedCount, "email")} sent.`,
      });
    } catch (e) {
      return errorText(e);
    }
  }

  async function remove() {
    if (!actor || !removing || busy) return;
    setBusy(true);
    try {
      const r = await unmarkFinalists([removing.id], actor);
      if (r.ok) {
        toast({ tone: "info", title: "Removed from the finalists", description: `${removing.name} is back to “Prototype submitted”.` });
        setRemoving(null);
      } else {
        toast({ tone: "error", title: "Couldn't remove the team", description: r.error.message });
      }
    } catch (e) {
      toast({ tone: "error", title: "Couldn't remove the team", description: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Finalists"
        description="Teams that submitted a prototype. Announcing a team makes it a finalist and emails its team leader."
        actions={
          <Button onClick={() => setAnnounceOpen(true)} disabled={chosen.length === 0}>
            <Megaphone aria-hidden="true" className="size-4" />
            {chosen.length > 0 ? `Announce ${plural(chosen.length, "finalist")}` : "Announce finalists"}
          </Button>
        }
      />

      <section aria-labelledby="ready" className="flex flex-col gap-3">
        <h2 id="ready" className="flex items-center gap-3 text-title font-semibold text-foam">
          Ready to announce <Badge>{ready.length}</Badge>
        </h2>
        {ready.length === 0 ? (
          <EmptyState
            title="No prototypes waiting"
            description={
              finalists.length > 0
                ? "Every team with a prototype is already a finalist."
                : "Teams show up here once they submit a prototype link."
            }
          />
        ) : (
          <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
            <table className="w-full border-separate border-spacing-0 text-small">
              <caption className="sr-only">Teams with a prototype that are not finalists yet</caption>
              <thead>
                <tr className="text-left text-haze">
                  <th scope="col" className="w-12 border-b border-edge bg-night px-2 py-2">
                    <Checkbox
                      checked={allTicked ? true : chosen.length > 0 ? "indeterminate" : false}
                      onCheckedChange={(on) => setPicked(on ? new Set(ready.map((t) => t.id)) : new Set())}
                      aria-label="Select every team"
                    />
                  </th>
                  {["Team", "Category", "Institution", "Prototype"].map((h) => (
                    <th key={h} scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ready.map((t) => (
                  <tr key={t.id} className="hover:bg-foam/5">
                    <td className="border-b border-edge/60 px-2">
                      <Checkbox checked={picked.has(t.id)} onCheckedChange={(on) => toggle(t.id, on)} aria-label={`Announce ${t.name}`} />
                    </td>
                    <TeamCells team={t} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="finalists" className="flex flex-col gap-3">
        <h2 id="finalists" className="flex items-center gap-3 text-title font-semibold text-foam">
          Finalists <Badge tone="aqua">{finalists.length}</Badge>
        </h2>
        {finalists.length === 0 ? (
          <EmptyState title="No finalists yet" description="Announced finalists are listed here." />
        ) : (
          <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
            <table className="w-full border-separate border-spacing-0 text-small">
              <caption className="sr-only">Finalists</caption>
              <thead>
                <tr className="text-left text-haze">
                  {["Team", "Category", "Institution", "Prototype"].map((h) => (
                    <th key={h} scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="border-b border-edge bg-night px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {finalists.map((t) => (
                  <tr key={t.id} className="hover:bg-foam/5">
                    <TeamCells team={t} />
                    <td className="border-b border-edge/60 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(t)}>
                        <UserMinus aria-hidden="true" className="size-4" />
                        Remove<span className="sr-only"> {t.name} from the finalists</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmByTyping
        open={announceOpen}
        onOpenChange={setAnnounceOpen}
        word="FINALISTS"
        title="Announce the finalists?"
        confirmLabel="Announce finalists"
        description={
          <span className="flex flex-col gap-2">
            <span>
              <strong className="font-semibold text-foam">{plural(chosen.length, "team")}</strong> will become finalists.{" "}
              <strong className="font-semibold text-foam">{plural(newlyEmailed, "team leader")}</strong> will be emailed.
            </span>
            <span>You can take a team off the list afterwards, but the email can&apos;t be taken back.</span>
          </span>
        }
        onConfirm={announce}
      />

      <Dialog
        open={removing !== null}
        onOpenChange={(o) => !busy && !o && setRemoving(null)}
        title={`Remove ${removing?.name ?? "this team"} from the finalists?`}
        description="The team goes back to “Prototype submitted”. Nobody is emailed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)} disabled={busy}>
              Keep as finalist
            </Button>
            <Button variant="danger" onClick={remove} loading={busy}>
              Remove from finalists
            </Button>
          </>
        }
      >
        <p className="text-small text-haze">
          Use this to fix a mistake. If the team already got its finalist email, it stays in their inbox, so tell them yourself.
        </p>
      </Dialog>
    </div>
  );
}

function TeamCells({ team: t }: { team: TeamRow }) {
  return (
    <>
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
        {t.prototype ? (
          <>
            {t.prototype.youtubeUrl ? (
              <a
                href={t.prototype.youtubeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                Watch<span className="sr-only"> {t.name}&apos;s video (opens in a new tab)</span>
              </a>
            ) : (
              "Submitted"
            )}
            <span className="text-haze"> · {formatShortDay(t.prototype.submittedAt)}</span>
          </>
        ) : (
          "—"
        )}
      </td>
    </>
  );
}
