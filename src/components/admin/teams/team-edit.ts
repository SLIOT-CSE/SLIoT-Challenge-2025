import { toInput, validate, type ErrorMap, type FormValues, type MemberValues } from "@/components/register/form";
import type { TeamDetail, TeamEditInput } from "@/lib/data";

// The team edit form reuses the registration form's values and rules, so a fix is held to the
// same standard as the original. Category can't change, so it stays fixed throughout.

export function toFormValues(team: TeamDetail): FormValues {
  const members: MemberValues[] = team.members.map((m) => ({
    fullName: m.fullName,
    whatsapp: m.whatsapp,
    email: m.email,
    nic: m.nic ?? "",
    institutionType: team.category === "open" ? m.institutionType : "",
    institutionName: team.category === "open" ? m.institutionName : "",
    institutionIsOther: team.category === "open" ? m.institutionIsOther : false,
  }));
  return {
    name: team.name,
    category: team.category,
    institutionName: team.institutionName ?? "",
    institutionIsOther: team.institutionIsOther,
    members,
  };
}

/** What `updateTeam` takes: the same as registration without the category */
export function toEditInput(values: FormValues): TeamEditInput {
  const input = toInput(values);
  return {
    name: input.name,
    institutionName: input.institutionName,
    institutionIsOther: input.institutionIsOther,
    members: input.members,
  };
}

/** Whether anything differs from what the team has now */
export function isDirty(initial: FormValues, current: FormValues): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current);
}

export function editErrors(values: FormValues): ErrorMap {
  return validate(values);
}
