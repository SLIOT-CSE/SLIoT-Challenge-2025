import { z } from "zod";
import { universities } from "@/content/universities";
import { INSTITUTION_TYPES, TEAM_SIZE, type CategoryId, type InstitutionType } from "@/lib/team-rules";
import { emailSchema, normaliseNic, text, whatsappSchema, teamNameSchema } from "./fields";

// The registration form's rules (docs/architecture.md, sections 5 and 6.1) that can be
// checked from one submission alone. Rules that need other teams (a repeated email or
// NIC across teams) or the clock live in the data layer.

const institutionTypeSchema = z.enum(INSTITUTION_TYPES);

export const memberInputSchema = z.object({
  fullName: text("Full name", 2, 80),
  whatsapp: whatsappSchema,
  email: emailSchema,
  /** Asked of university students and independent entrants */
  nic: z.string().trim().optional(),
  /** Open teams only: each member picks their own */
  institutionType: institutionTypeSchema.optional(),
  institutionName: z.string().trim().optional(),
  institutionIsOther: z.boolean().optional(),
});

export type MemberInput = z.input<typeof memberInputSchema>;

export const categorySchema = z.enum(["school", "university", "open"]);

export interface RuleIssue {
  path: (string | number)[];
  message: string;
}

/** The team-level shape the rules read. Wider than the parsed schema so forms can use it too */
export interface TeamRuleInput {
  category: CategoryId | "";
  institutionName?: string;
  institutionIsOther?: boolean;
  members: {
    email: string;
    nic?: string;
    institutionType?: InstitutionType | "";
    institutionName?: string;
    institutionIsOther?: boolean;
  }[];
}

/**
 * The rules that look across fields: the shared institution, NIC for university students and
 * repeats inside the form. A plain function, so the form can run it on half-filled values
 * (zod skips refinements while any field is invalid) and the schema runs the same code.
 */
export function teamRuleIssues(team: TeamRuleInput): RuleIssue[] {
  type Path = (string | number)[];
  const issues: RuleIssue[] = [];
  const issue = (path: Path, message: string) => issues.push({ path, message });

  /** Checks one institution (a team's, or an Open member's) */
  const checkInstitution = (
    type: InstitutionType,
    name: string | undefined,
    isOther: boolean | undefined,
    namePath: Path,
  ) => {
    if (!name) {
      issue(
        namePath,
        type === "school" ? "Enter the school name" : isOther ? "Enter the university name" : "Choose a university",
      );
      return;
    }
    if (type === "university" && !isOther && !(universities as readonly string[]).includes(name)) {
      issue(namePath, "Choose a university from the list, or pick Other and type its name");
    }
    if (type === "school" && isOther) issue(namePath, "Only universities can be marked Other");
  };

  if (team.category === "school" || team.category === "university") {
    checkInstitution(team.category, team.institutionName?.trim(), team.institutionIsOther, ["institutionName"]);
  }

  const seenEmail = new Map<string, number>();
  const seenNic = new Map<string, number>();

  team.members.forEach((m, i) => {
    const at = (field: string): Path => ["members", i, field];

    // Which institution type does this member belong to?
    let type: InstitutionType | null = null;
    if (team.category === "open") {
      if (!m.institutionType) issue(at("institutionType"), "Choose School, University, or Independent");
      else {
        type = m.institutionType;
        if (type === "school" || type === "university") {
          checkInstitution(type, m.institutionName?.trim(), m.institutionIsOther, at("institutionName"));
        }
      }
    } else if (team.category) {
      type = team.category;
    }

    // NIC: every university student and independent entrant; school students exempt
    if (type === "university" || type === "independent") {
      const nic = m.nic?.trim();
      if (!nic) {
        issue(
          at("nic"),
          type === "university" ? "NIC is required for university students" : "NIC is required for independent entrants",
        );
      } else if (!normaliseNic(nic)) issue(at("nic"), "Enter a valid NIC, like 123456789V or 200012345678");
      else {
        const normal = normaliseNic(nic)!;
        const first = seenNic.get(normal);
        if (first !== undefined) issue(at("nic"), `Same NIC as member ${first + 1}`);
        else seenNic.set(normal, i);
      }
    }

    const email = m.email.trim().toLowerCase();
    if (email) {
      const firstEmail = seenEmail.get(email);
      if (firstEmail !== undefined) issue(at("email"), `Same email as member ${firstEmail + 1}`);
      else seenEmail.set(email, i);
    }
  });

  return issues;
}

export const registrationInputSchema = z
  .object({
    name: teamNameSchema,
    category: categorySchema,
    /** School and University teams only: one institution for the whole team */
    institutionName: z.string().trim().optional(),
    institutionIsOther: z.boolean().optional(),
    members: z
      .array(memberInputSchema)
      .min(TEAM_SIZE.min, { error: "A team needs at least one member" })
      .max(TEAM_SIZE.max, { error: `A team can have at most ${TEAM_SIZE.max} members` }),
  })
  .superRefine((team, ctx) => {
    for (const { path, message } of teamRuleIssues(team)) ctx.addIssue({ code: "custom", message, path });
  })
  .transform((team) => {
    const teamInstitution = team.category === "open" ? null : (team.institutionName as string);
    const institutionIsOther = team.category === "open" ? false : Boolean(team.institutionIsOther);

    return {
      name: team.name,
      category: team.category as CategoryId,
      institutionName: teamInstitution,
      institutionIsOther,
      members: team.members.map((m, i) => {
        const type: InstitutionType = team.category === "open" ? (m.institutionType as InstitutionType) : team.category;
        const fromTeam = team.category !== "open";
        return {
          position: i + 1,
          fullName: m.fullName,
          whatsapp: m.whatsapp,
          email: m.email,
          institutionType: type,
          institutionName: fromTeam ? (teamInstitution as string) : type === "independent" ? null : (m.institutionName as string),
          institutionIsOther: fromTeam ? institutionIsOther : type === "independent" ? false : Boolean(m.institutionIsOther),
          nic: type === "school" ? null : normaliseNic(m.nic as string),
        };
      }),
    };
  });

export type RegistrationInput = z.input<typeof registrationInputSchema>;
/** What gets stored: institutions filled in on every member, NIC normalised, positions set */
export type RegistrationData = z.output<typeof registrationInputSchema>;
export type MemberData = RegistrationData["members"][number];
