"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getSettings, listShortlistFinalisations, listTeams, store, type Settings, type ShortlistFinalisation, type TeamRow } from "@/lib/data";

export interface AdminData {
  teams: TeamRow[];
  settings: Settings;
  finalisations: ShortlistFinalisation[];
}

/**
 * Teams, settings and shortlist history for the Shortlist and Finalists screens. Loads on mount and
 * again whenever the sample store changes, keeping what it has while it does; only a failed first
 * load reports `offline`.
 */
export function useAdminData(): { data: AdminData | null; offline: boolean; retry: () => void } {
  const [data, setData] = useState<AdminData | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTeams(), getSettings(), listShortlistFinalisations()])
      .then(([teams, settings, finalisations]) => {
        if (cancelled) return;
        setData({ teams, settings, finalisations });
        setOffline(false);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey]);

  return { data, offline, retry: () => setReloadKey((k) => k + 1) };
}
