"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { adminLogout, dataVersion, logout, type ShortlistState } from "@/lib/data";
import { STAGES, TIME_ZONE, type Stage } from "@/lib/competition";
import { cn } from "@/lib/utils";
import {
  getDevState,
  loginAsDevAdmin,
  loginAsDevTeam,
  resetDevData,
  setDevShortlistState,
  setDevStage,
  switchToRealClock,
  type DevState,
} from "@/server/dev-actions";

// Development-only panel for the app screens (/register, /team, /admin), working on the local
// SQLite database: moves the dev clock between competition stages, flips the shortlist between
// draft and finalised, signs in as any team or organizer and reseeds the 20 test teams
// (same as `pnpm db:seed`). It renders nothing in production, and the server refuses its calls there.

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

export function SampleSwitcher() {
  if (process.env.NODE_ENV === "production") return null;
  return <Panel />;
}

/** Runs a dev action, then tells every open screen to read its data again */
async function run(action: () => Promise<unknown>) {
  try {
    await action();
  } finally {
    dataVersion.bump();
  }
}

function Panel() {
  const version = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);
  const [state, setState] = useState<DevState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDevState().then(
      (next) => {
        if (!cancelled) setState(next);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (!state) return null;

  const { now, stage, teams, admins } = state;
  const loggedIn = teams.find((t) => t.id === state.teamId);
  const organizer = admins.find((a) => a.id === state.adminId);

  return (
    <aside
      aria-label="Sample data controls"
      className="fixed right-4 bottom-4 z-dropdown w-[min(20rem,calc(100vw-2rem))] rounded-panel border border-edge bg-night text-small text-foam shadow-lift"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-warning px-2 py-0.5 text-caption font-semibold text-abyss">Test data</span>
          <span className="text-haze">{STAGE_LABEL[stage]}</span>
        </span>
        <span aria-hidden="true" className="text-haze">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-edge p-4">
          <Field
            label="Competition stage"
            hint={`${state.devClock ? "Dev clock" : "Real clock"}: ${dateTime.format(now)} (Sri Lanka time)`}
          >
            <select
              className={selectClass}
              value={state.devClock ? stage : "real"}
              onChange={(e) =>
                void run(() => (e.target.value === "real" ? switchToRealClock() : setDevStage(e.target.value as Stage)))
              }
            >
              <option value="real">Real clock ({STAGE_LABEL[stage]})</option>
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
                    state.shortlistState === value ? "border-mint bg-mint/15 text-mint" : "border-edge text-haze",
                  )}
                >
                  <input
                    type="radio"
                    name="sample-shortlist"
                    className="sr-only"
                    checked={state.shortlistState === value}
                    onChange={() => void run(() => setDevShortlistState(value))}
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
                aria-label="Log in as a test team"
                onChange={(e) => {
                  if (e.target.value) void run(() => loginAsDevTeam(Number(e.target.value)));
                }}
              >
                <option value="">Log in as…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
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

          <Field
            label="Organizer"
            hint={
              organizer
                ? `Signed in as ${organizer.displayName} (${organizer.role === "super_admin" ? "super admin" : "admin"})`
                : "Not signed in"
            }
          >
            <div className="flex gap-2">
              <select
                className={selectClass}
                value=""
                aria-label="Sign in as a test organizer"
                onChange={(e) => {
                  if (e.target.value) void run(() => loginAsDevAdmin(Number(e.target.value)));
                }}
              >
                <option value="">Sign in as…</option>
                {admins
                  .filter((a) => !a.disabled)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName} · {a.role === "super_admin" ? "super admin" : "admin"}
                    </option>
                  ))}
              </select>
              {organizer && (
                <button type="button" onClick={() => void adminLogout()} className={smallButton}>
                  Sign out
                </button>
              )}
            </div>
          </Field>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Wipe the local database and write the 20 test teams again? Everyone is signed out.")) {
                void run(resetDevData);
              }
            }}
            className={smallButton}
          >
            Reset test data (pnpm db:seed)
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
