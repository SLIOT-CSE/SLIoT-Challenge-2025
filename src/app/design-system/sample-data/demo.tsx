"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCompetitionState,
  listTeams,
  store,
  type CompetitionState,
  type TeamRow,
} from "@/lib/data";

// Reads through the data-access functions, as the real screens will
export function SampleDataDemo() {
  const version = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  const [state, setState] = useState<CompetitionState | null>(null);
  const [teams, setTeams] = useState<TeamRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getCompetitionState(), listTeams()]).then(([s, t]) => {
      if (cancelled) return;
      setState(s);
      setTeams(t);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (!state || !teams) return <p className="text-haze">Loading sample data…</p>;

  return (
    <>
      <p data-testid="state" className="text-body-lg">
        Stage: <strong>{state.stage}</strong> · Shortlist: <strong>{state.shortlistState}</strong> · {teams.length} teams
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-small">
          <thead className="text-haze">
            <tr>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Team</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Stage</th>
              <th className="py-2">Members</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-t border-edge">
                <td className="py-2 pr-4 font-mono">{t.code}</td>
                <td className="py-2 pr-4">{t.name}</td>
                <td className="py-2 pr-4">{t.category}</td>
                <td className="py-2 pr-4">{t.stage}</td>
                <td className="py-2">{t.members.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
