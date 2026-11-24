"use server";

import type {
  AdminActor,
  AdminRole,
  AuditFilter,
  DeadlineSettings,
  NewAdminInput,
  TeamEditInput,
  TeamFilter,
} from "@/lib/data/types";
import type { RegistrationGuard } from "./backend/team";
import { requestBackend } from "./request";

// The server actions the screens call, through src/lib/data. Each one runs the backend for the
// current request: the session comes from the cookie, never from the arguments. The `actor`
// arguments are kept so the screens didn't have to change, and are ignored.
//
// Next checks the Origin header of every server action against the host, so another site
// can't call these from a visitor's browser (docs/architecture.md, section 8).

const b = requestBackend;

export async function getCompetitionState() { return (await b()).getCompetitionState(); }
export async function getSettings() { return (await b()).getSettings(); }

export async function registerTeam(input: unknown, guard?: RegistrationGuard) { return (await b()).registerTeam(input, guard); }
export async function loginWithCode(code: string) { return (await b()).loginWithCode(code); }
export async function logout() { return (await b()).logout(); }
export async function getCurrentTeam() { return (await b()).getCurrentTeam(); }
export async function requestCodeReminder(email: string) { return (await b()).requestCodeReminder(email); }
export async function submitPrototype(link: string) { return (await b()).submitPrototype(link); }

export async function getTeam(teamId: number) { return (await b()).getTeam(teamId); }
export async function listTeams(filter?: TeamFilter) { return (await b()).listTeams(filter); }

export async function setShortlistMarks(teamIds: number[], marked: boolean, actor?: AdminActor) {
  return (await b()).setShortlistMarks(teamIds, marked, actor);
}
export async function finaliseShortlist(actor: AdminActor | undefined, confirmation: string) {
  return (await b()).finaliseShortlist(actor, confirmation);
}
export async function reopenShortlist(actor?: AdminActor) { return (await b()).reopenShortlist(actor); }
export async function announceFinalists(teamIds: number[], actor: AdminActor | undefined, confirmation: string) {
  return (await b()).announceFinalists(teamIds, actor, confirmation);
}
export async function unmarkFinalists(teamIds: number[], actor?: AdminActor) { return (await b()).unmarkFinalists(teamIds, actor); }
export async function listShortlistFinalisations() { return (await b()).listShortlistFinalisations(); }

export async function listOutbox(teamId?: number) { return (await b()).listOutbox(teamId); }
export async function getAuditLog(filter?: { targetType?: string; targetId?: string; limit?: number }) {
  return (await b()).getAuditLog(filter);
}

export async function adminLogin(username: string, password: string) { return (await b()).adminLogin(username, password); }
export async function adminLogout() { return (await b()).adminLogout(); }
export async function getCurrentAdmin() { return (await b()).getCurrentAdmin(); }

export async function updateTeam(teamId: number, edit: TeamEditInput & { expectedUpdatedAt?: number }, actor?: AdminActor) {
  return (await b()).updateTeam(teamId, edit, actor);
}
export async function resendCode(teamId: number, actor?: AdminActor) { return (await b()).resendCode(teamId, actor); }
export async function exportTeamsCsv(teamIds: number[] | undefined, actor?: AdminActor) {
  return (await b()).exportTeamsCsv(teamIds, actor);
}
export async function exportToSheets(actor?: AdminActor) { return (await b()).exportToSheets(actor); }

export async function updateSettings(patch: Partial<DeadlineSettings>, actor?: AdminActor) {
  return (await b()).updateSettings(patch, actor);
}
export async function listAdmins(actor?: AdminActor) { return (await b()).listAdmins(actor); }
export async function createAdmin(input: NewAdminInput, actor?: AdminActor) { return (await b()).createAdmin(input, actor); }
export async function resetAdminPassword(adminId: number, actor?: AdminActor) { return (await b()).resetAdminPassword(adminId, actor); }
export async function setAdminDisabled(adminId: number, disabled: boolean, actor?: AdminActor) {
  return (await b()).setAdminDisabled(adminId, disabled, actor);
}
export async function setAdminRole(adminId: number, role: AdminRole, actor?: AdminActor) {
  return (await b()).setAdminRole(adminId, role, actor);
}
export async function listAuditLog(actor: AdminActor | undefined, filter?: AuditFilter) {
  return (await b()).listAuditLog(actor, filter);
}
