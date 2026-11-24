"use client";

import { useState, useSyncExternalStore } from "react";
import {
  listSampleTeamLogins,
  loginWithCode,
  logout,
  resetSampleData,
  setSampleShortlistState,
  setSampleStage,
  store,
  type ShortlistState,
} from "@/lib/data";
import { STAGES, TIME_ZONE, stageAt, type Stage } from "@/lib/competition";
import { cn } from "@/lib/utils";

// Development-only panel for the app screens (/register, /team, /admin): moves the sample
// clock between competition stages, flips the shortlist between draft and finalised, logs in
// as any sample team and resets the 20 sample teams. It renders nothing in production.

const STAGE_LABEL: Record<Stage, string> = {
  "before-registration": "Before registration",
  registration: "Registration open",
  proposal: "Proposals open",
  shortlisting: "Shortlisting",
  prototype: "Prototypes open",
  finale: "Grand finale",
  over: "Over",
};

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

const noopSubscribe = () => () => undefined;

export function SampleSwitcher() {
  if (process.env.NODE_ENV === "production") return null;
  return <Panel />;
}

function Panel() {
  // Reading the store only after mount keeps the first client render equal to the server's
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  const [open, setOpen] = useState(false);

  if (!mounted) return null;

  const { settings, teams, session } = store.state;
  const now = store.now();
  const stage = stageAt(new Date(now), settings.deadlines);
  const loggedIn = teams.find((t) => t.id === session?.teamId);

  return (
    <aside
      aria-label="Sample data controls"
      className="fixed right-4 bottom-4 z-tooltip w-[min(20rem,calc(100vw-2rem))] rounded-panel border border-edge bg-night text-small text-foam shadow-lift"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-warning px-2 py-0.5 text-caption font-semibold text-abyss">Sample data</span>
          <span className="text-haze">{STAGE_LABEL[stage]}</span>
        </span>
        <span aria-hidden="true" className="text-haze">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-edge p-4">
          <Field label="Competition stage" hint={`Clock: ${dateTime.format(now)} (Sri Lanka time)`}>
            <select
              className={selectClass}
              value={stage}
              onChange={(e) => setSampleStage(e.target.value as Stage)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 font-semibold">Shortlist</legend>
            <div className="flex gap-2">
              {(["draft", "finalised"] as ShortlistState[]).map((value) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-control border px-3 capitalize has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint",
                    settings.shortlistState === value ? "border-mint bg-mint/15 text-mint" : "border-edge text-haze",
                  )}
                >
                  <input
                    type="radio"
                    name="sample-shortlist"
                    className="sr-only"
                    checked={settings.shortlistState === value}
                    onChange={() => setSampleShortlistState(value)}
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Team" hint={loggedIn ? `Logged in as ${loggedIn.name}` : "Not logged in"}>
            <div className="flex gap-2">
              <select
                className={selectClass}
                value=""
                aria-label="Log in as a sample team"
                onChange={(e) => {
                  if (e.target.value) void loginWithCode(e.target.value);
                }}
              >
                <option value="">Log in as…</option>
                {listSampleTeamLogins().map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name} · {t.category} · {t.stage.replace("_", " ")}
                  </option>
                ))}
              </select>
              {loggedIn && (
                <button type="button" onClick={() => void logout()} className={smallButton}>
                  Log out
                </button>
              )}
            </div>
          </Field>

          <button type="button" onClick={resetSampleData} className={cn(smallButton, "w-full")}>
            Reset sample data
          </button>
        </div>
      )}
    </aside>
  );
}

const selectClass =
  "min-h-11 w-full rounded-control border border-edge bg-deep px-3 text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";

const smallButton =
  "min-h-11 shrink-0 rounded-control border border-edge px-3 font-semibold text-foam hover:bg-foam/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      {children}
      <span className="text-caption text-haze">{hint}</span>
    </label>
  );
}
