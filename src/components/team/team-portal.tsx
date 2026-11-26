"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  getCompetitionState,
  getCurrentTeam,
  dataVersion,
  type CompetitionState,
  type TeamDetail,
} from "@/lib/data";
import { Dashboard } from "./dashboard";
import { LoginForm } from "./login-form";

type Loaded = { team: TeamDetail | null; comp: CompetitionState };

/**
 * /team: the login before you're in, the dashboard after. Reads the session and the competition
 * state on load and again whenever data changes (dataVersion) (an upload, for example), and
 * keeps showing what it has while it does, so the dashboard never flashes away mid-upload.
 */
export function TeamPortal() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const storeVersion = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCurrentTeam(), getCompetitionState()])
      .then(([team, comp]) => {
        if (cancelled) return;
        setLoaded({ team, comp });
        setOffline(false);
      })
      .catch(() => {
        // A failed refresh keeps the screen as it is; only a failed first load shows the error
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey]);

  if (!loaded) {
    return offline ? (
      <Panel>
        <div className="flex flex-col items-start gap-5">
          <h1 className="text-title font-semibold text-foam">We couldn&apos;t load the team portal</h1>
          <p className="text-body text-haze">Check your connection and try again.</p>
          <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      </Panel>
    ) : (
      <Skeleton />
    );
  }

  if (!loaded.team) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-display-lg text-foam">Team portal</h1>
          <p className="text-body-lg text-haze">
            Log in with your team code to upload your proposal and follow your team&apos;s progress.
          </p>
        </div>
        <Panel>
          <LoginForm />
        </Panel>
      </div>
    );
  }

  return <Dashboard team={loaded.team} comp={loaded.comp} />;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">{children}</div>;
}

/** The shape of the dashboard while it loads */
function Skeleton() {
  const block = "rounded-panel bg-night/60 ring-1 ring-edge ring-inset motion-safe:animate-pulse";
  return (
    <div role="status" aria-label="Loading your team portal" className="flex flex-col gap-6">
      <div className="h-14 w-72 rounded-control bg-night/60 motion-safe:animate-pulse" />
      <div className={`${block} h-36`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <div className={`${block} h-72`} />
          <div className={`${block} h-48`} />
        </div>
        <div className={`${block} h-80`} />
      </div>
    </div>
  );
}
