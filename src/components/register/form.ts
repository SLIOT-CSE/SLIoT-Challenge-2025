import { registrationInputSchema, teamRuleIssues, type RegistrationInput } from "@/lib/schemas";
import { TEAM_SIZE, type CategoryId, type InstitutionType } from "@/lib/team-rules";
import type { DataError } from "@/lib/data";

// The registration form's state and rules, with no React in it. Values are raw strings, as
// typed; the shared zod schema decides what is valid (see docs/frontend-plan.md, section 6.1).

export type StepId = "team" | "institution" | "members" | "review";

export const STEP_LABEL: Record<StepId, string> = {
  team: "Team",
  institution: "Institution",
  members: "Members",
  review: "Review",
};

export interface MemberValues {
  fullName: string;
  whatsapp: string;
  email: string;
  nic: string;
  /** Open teams only; "" until chosen */
  institutionType: "" | InstitutionType;
  institutionName: string;
  institutionIsOther: boolean;
}

export interface FormValues {
  name: string;
  /** "" until chosen */
  category: "" | CategoryId;
  /** School and University teams only */
  institutionName: string;
  institutionIsOther: boolean;
  members: MemberValues[];
}

/** Error message by field path, e.g. `members.1.nic` */
export type ErrorMap = Record<string, string>;

export const emptyMember = (): MemberValues => ({
  fullName: "",
  whatsapp: "",
  email: "",
  nic: "",
  institutionType: "",
  institutionName: "",
  institutionIsOther: false,
});

export const emptyValues = (category: "" | CategoryId = ""): FormValues => ({
  name: "",
  category,
  institutionName: "",
  institutionIsOther: false,
  members: [emptyMember()],
});

/** Open teams skip the Institution step: each member names their own */
export function stepsFor(category: "" | CategoryId): StepId[] {
  return category === "open" ? ["team", "members", "review"] : ["team", "institution", "members", "review"];
}

/** Which step a field path belongs to */
export function stepOfPath(path: string): StepId {
  if (path === "name" || path === "category") return "team";
  if (path === "institutionName" || path === "institutionIsOther") return "institution";
  return "members";
}

/** What type of institution a member belongs to, or null while an Open member hasn't chosen */
export function memberType(category: "" | CategoryId, m: MemberValues): InstitutionType | null {
  if (category === "school" || category === "university") return category;
  if (category === "open") return m.institutionType || null;
  return null;
}

/** NIC is asked of university students only */
export const asksNic = (category: "" | CategoryId, m: MemberValues): boolean =>
  memberType(category, m) === "university";

/** The form's values as the schema expects them, leaving out anything the category doesn't use */
export function toInput(v: FormValues): RegistrationInput {
  const open = v.category === "open";
  const sharedInstitution = v.category === "school" || v.category === "university";
  return {
    name: v.name,
    category: v.category as CategoryId,
    institutionName: sharedInstitution ? v.institutionName : undefined,
    institutionIsOther: sharedInstitution ? v.institutionIsOther : undefined,
    members: v.members.map((m) => ({
      fullName: m.fullName,
      whatsapp: m.whatsapp,
      email: m.email,
      nic: m.nic,
      institutionType: open && m.institutionType ? m.institutionType : undefined,
      institutionName: open ? m.institutionName : undefined,
      institutionIsOther: open ? m.institutionIsOther : undefined,
    })),
  };
}

function valueAt(v: FormValues, path: string): unknown {
  const [head, index, field] = path.split(".");
  if (head === "members" && index !== undefined && field) {
    return (v.members[Number(index)] as unknown as Record<string, unknown> | undefined)?.[field];
  }
  return (v as unknown as Record<string, unknown>)[head];
}

/** Plainer wording for the commonest mistake: leaving something empty */
function friendly(path: string, message: string, v: FormValues): string {
  if (valueAt(v, path) === "") {
    if (path === "category") return "Choose a category";
    if (path.endsWith(".whatsapp")) return "WhatsApp number is required";
    if (path.endsWith(".email")) return "Email is required";
  }
  return message;
}

/** Every problem with the values as they are now, first message per field */
export function validate(v: FormValues): ErrorMap {
  const errors: ErrorMap = {};
  const input = toInput(v);
  const add = (path: string, message: string) => {
    if (!(path in errors)) errors[path] = friendly(path, message, v);
  };

  const result = registrationInputSchema.safeParse(input);
  if (!result.success) for (const issue of result.error.issues) add(issue.path.join("."), issue.message);

  // zod skips the cross-field rules while any field is invalid; run them on their own so every
  // problem shows at once and each step can be checked before the later ones are filled in
  for (const issue of teamRuleIssues(input)) add(issue.path.join("."), issue.message);

  if (!v.category) errors.category = "Choose a category";
  return errors;
}

/** The problems in one step only */
export function errorsForStep(errors: ErrorMap, step: StepId): ErrorMap {
  return Object.fromEntries(Object.entries(errors).filter(([path]) => stepOfPath(path) === step));
}

/** The server's answer as field errors, so it shows exactly where local errors do */
export function serverErrors(error: DataError): ErrorMap {
  const errors: ErrorMap = {};
  for (const issue of error.issues ?? []) {
    if (!(issue.path in errors)) errors[issue.path] = issue.message;
  }
  for (const c of error.conflicts ?? []) {
    errors[`members.${c.memberPosition - 1}.${c.field}`] =
      c.field === "email"
        ? "This email is already registered with a team. One person can only be in one team."
        : "This NIC is already registered with a team. One person can only be in one team.";
  }
  return errors;
}

/** The earliest step (in this category's order) that has an error */
export function firstStepWithError(errors: ErrorMap, category: "" | CategoryId): StepId | null {
  const steps = new Set(Object.keys(errors).map(stepOfPath));
  return stepsFor(category).find((s) => steps.has(s)) ?? null;
}

/** Changing category clears what the new category no longer uses; names and contacts stay */
export function changeCategory(v: FormValues, category: CategoryId): FormValues {
  if (v.category === category) return v;
  return {
    ...v,
    category,
    // A school name isn't a university and vice versa, so the shared institution starts again
    institutionName: "",
    institutionIsOther: false,
    // Members' own institutions only exist in Open teams
    members: v.members.map((m) => ({ ...m, institutionType: "", institutionName: "", institutionIsOther: false })),
  };
}

export const canAddMember = (v: FormValues): boolean => v.members.length < TEAM_SIZE.max;

export function addMember(v: FormValues): FormValues {
  return canAddMember(v) ? { ...v, members: [...v.members, emptyMember()] } : v;
}

/** The leader (index 0) can't be removed */
export function removeMember(v: FormValues, index: number): FormValues {
  if (index <= 0 || index >= v.members.length) return v;
  return { ...v, members: v.members.filter((_, i) => i !== index) };
}

/** Moves error and touched keys when a member is removed, so messages stay with the right card */
export function shiftMemberPaths<T>(map: Record<string, T>, removedIndex: number): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [path, value] of Object.entries(map)) {
    const m = /^members\.(\d+)\.(.+)$/.exec(path);
    if (!m) {
      out[path] = value;
      continue;
    }
    const i = Number(m[1]);
    if (i === removedIndex) continue;
    out[i > removedIndex ? `members.${i - 1}.${m[2]}` : path] = value;
  }
  return out;
}
