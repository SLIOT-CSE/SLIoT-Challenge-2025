import * as actions from "@/server/actions";
import { NetworkError } from "./errors";
import type { ProposalUpload, Result, UploadOptions } from "./types";

// What the screens import. Every function calls the server (src/server/actions.ts), which reads
// and writes the SQLite database; the session lives in an httpOnly cookie.
//
// Two things happen here, in the browser:
// - a call that gets no answer (offline, server down, a crash on the server) throws NetworkError,
//   so screens can tell "no answer" apart from a Result error and keep what the person typed;
// - after a write, `dataVersion` ticks, so screens that show data read it again.

/** Ticks after every write, so open screens refresh. Use with useSyncExternalStore */
export const dataVersion = (() => {
  let version = 0;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: () => version,
    bump() {
      version++;
      listeners.forEach((l) => l());
    },
  };
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<any>;

function call<F extends AnyFn>(fn: F, { write }: { write: boolean }): F {
  return (async (...args: Parameters<F>) => {
    let result: Awaited<ReturnType<F>>;
    try {
      result = await fn(...args);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error(error);
      throw new NetworkError();
    }
    // Writes that changed something; a refused write (ok: false) changed nothing
    if (write && !(result && typeof result === "object" && "ok" in result && result.ok === false)) dataVersion.bump();
    return result;
  }) as F;
}

const read = <F extends AnyFn>(fn: F) => call(fn, { write: false });
const write = <F extends AnyFn>(fn: F) => call(fn, { write: true });

export const getCompetitionState = read(actions.getCompetitionState);
export const getSettings = read(actions.getSettings);
export const registerTeam = write(actions.registerTeam);
export const loginWithCode = write(actions.loginWithCode);
export const logout = write(actions.logout);
export const getCurrentTeam = read(actions.getCurrentTeam);
export const requestCodeReminder = write(actions.requestCodeReminder);
export const submitPrototype = write(actions.submitPrototype);
export const getTeam = read(actions.getTeam);
export const listTeams = read(actions.listTeams);
export const setShortlistMarks = write(actions.setShortlistMarks);
export const finaliseShortlist = write(actions.finaliseShortlist);
export const reopenShortlist = write(actions.reopenShortlist);
export const announceFinalists = write(actions.announceFinalists);
export const unmarkFinalists = write(actions.unmarkFinalists);
export const listShortlistFinalisations = read(actions.listShortlistFinalisations);
export const listOutbox = read(actions.listOutbox);
export const getAuditLog = read(actions.getAuditLog);
export const adminLogin = write(actions.adminLogin);
export const adminLogout = write(actions.adminLogout);
export const getCurrentAdmin = read(actions.getCurrentAdmin);
export const updateTeam = write(actions.updateTeam);
export const resendCode = write(actions.resendCode);
export const exportTeamsCsv = write(actions.exportTeamsCsv);
export const exportToSheets = write(actions.exportToSheets);
export const updateSettings = write(actions.updateSettings);
export const listAdmins = read(actions.listAdmins);
export const createAdmin = write(actions.createAdmin);
export const resetAdminPassword = write(actions.resetAdminPassword);
export const setAdminDisabled = write(actions.setAdminDisabled);
export const setAdminRole = write(actions.setAdminRole);
export const listAuditLog = read(actions.listAuditLog);

/**
 * Uploads the proposal PDF to POST /api/team/proposal with progress. XMLHttpRequest rather than
 * fetch, because fetch can't report upload progress.
 */
export function uploadProposal({ file }: ProposalUpload, { onProgress, signal }: UploadOptions = {}): Promise<Result<{ version: number }>> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("The upload was aborted.", "AbortError"));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/team/proposal");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const result = xhr.response as Result<{ version: number }> | null;
      if (!result || typeof result !== "object" || !("ok" in result)) return reject(new NetworkError());
      if (result.ok) dataVersion.bump();
      resolve(result);
    };
    xhr.onerror = () => reject(new NetworkError());
    xhr.onabort = () => reject(new DOMException("The upload was aborted.", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export { NetworkError } from "./errors";
export { auditActionGroup, AUDIT_ACTION_GROUPS } from "./audit";
export { buildTeamsCsv, csvCell, formatColomboTime, shortlistResult } from "./csv";
export * from "./types";
