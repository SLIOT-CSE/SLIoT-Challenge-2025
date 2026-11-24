import { createData } from "./api";
import { createDev } from "./dev";
import { generateSampleState } from "./sample";
import { Store, sessionStoragePersistence } from "./store";

// What the screens import. The functions are bound to one sample store per browser tab,
// saved in sessionStorage. In step R this file exports the same names backed by the server.
//
// While Next prerenders on the server the store is a throwaway in-memory copy, so screens
// must read data in effects (or on user action), never while rendering on the server.

const inBrowser = typeof window !== "undefined";

export const store = new Store({
  seed: generateSampleState,
  persistence: inBrowser ? sessionStoragePersistence : undefined,
  // A short pretend delay in the browser so loading states can be seen
  latencyMs: inBrowser ? 250 : 0,
});

const data = createData(store);
const dev = createDev(store);

export const {
  getCompetitionState,
  getSettings,
  registerTeam,
  loginWithCode,
  logout,
  getCurrentTeam,
  requestCodeReminder,
  getTeam,
  listTeams,
  uploadProposal,
  submitPrototype,
  setShortlistMarks,
  finaliseShortlist,
  reopenShortlist,
  announceFinalists,
  unmarkFinalists,
  listShortlistFinalisations,
  listOutbox,
  getAuditLog,
} = data;

export const { setSampleStage, setSampleShortlistState, setSampleNetworkError, resetSampleData, listSampleTeamLogins } =
  dev;

export { NetworkError } from "./errors";
export { SAMPLE_SUPER_ADMIN } from "./sample";
export type { CompetitionState, ProposalUpload, UploadOptions } from "./api";
export * from "./types";
