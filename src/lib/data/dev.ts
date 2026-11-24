import type { Stage } from "@/lib/competition";
import { sampleTimeForStage } from "./clock";
import type { Store } from "./store";
import type { ShortlistState } from "./types";

// Controls for the development-only switcher. They change the sample clock and the
// shortlist state directly, skipping the checks the real flows have, and do not exist in
// the backend.

export interface SampleTeamLogin {
  code: string;
  name: string;
  category: string;
  stage: string;
}

export function createDev(store: Store) {
  return {
    /** Moves the sample clock to the middle of a competition stage */
    setSampleStage(stage: Stage): void {
      store.mutate((s) => {
        s.settings.now = sampleTimeForStage(stage, s.settings.deadlines);
      });
    },

    setSampleShortlistState(state: ShortlistState): void {
      store.mutate((s) => {
        s.settings.shortlistState = state;
      });
    },

    /** While on, every data call throws a NetworkError, to see each screen's offline state */
    setSampleNetworkError(on: boolean): void {
      store.mutate((s) => {
        s.settings.simulateNetworkError = on;
      });
    },

    /** Reseeds the 20 teams, the clock and everything else */
    resetSampleData(): void {
      store.reset();
    },

    /** Every team's code, for logging in as it without typing */
    listSampleTeamLogins(): SampleTeamLogin[] {
      return store.state.teams.map((t) => ({ code: t.code, name: t.name, category: t.category, stage: t.stage }));
    },
  };
}

export type Dev = ReturnType<typeof createDev>;
