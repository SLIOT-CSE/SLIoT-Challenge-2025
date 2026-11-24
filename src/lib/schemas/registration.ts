import { z } from "zod";
import { universities } from "@/content/universities";
import { TEAM_SIZE, type CategoryId, type InstitutionType } from "@/lib/team-rules";
import { emailSchema, normaliseNic, text, whatsappSchema } from "./fields";

// The registration form's rules (docs/architecture.md, sections 5 and 6.1) that can be
// checked from one submission alone. Rules that need other teams (a repeated email or
// NIC across teams) or the clock live in the data layer.

const institutionTypeSchema = z.enum(["school", "university"]);

export const memberInputSchema = z.object({
  fullName: text("Full name", 2, 80),
  whatsapp: whatsappSchema,
  email: emailSchema,
  /** Asked of university students only */
  nic: z.string().trim().optional(),
  /** Open teams only: each member picks their own */
  institutionType: institutionTypeSchema.optional(),
  institutionName: z.string().trim().optional(),
  institutionIsOther: z.boolean().optional(),
});

export type MemberInput = z.input<typeof memberInputSchema>;

export const categorySchema = z.enum(["school", "university", "open"]);

export const registrationInputSchema = z
  .object({
    name: text("Team name", 2, 60),
    category: categorySchema,
    /** School and University teams only: one institution for the whole team */
    institutionName: z.string().trim().optional(),
    institutionIsOther: z.boolean().optional(),
    members: z
      .array(memberInputSchema)
      .min(TEAM_SIZE.min, { error: "A team needs at least one member" })
      .max(TEAM_SIZE.max, { error: `A team can have at most ${TEAM_SIZE.max} members` }),
    consent: z.literal(true, { error: "You need to accept the privacy notice to register" }),
  })
  .superRefine((team, ctx) => {
    type Path = (string | number)[];
    const issue = (path: Path, message: string) => ctx.addIssue({ code: "custom", message, path });

    /** Checks one institution (a team's, or an Open member's) */
    const checkInstitution = (
      type: InstitutionType,
      name: string | undefined,
      isOther: boolean | undefined,
      namePath: Path,
    ) => {
      if (!name) {
        issue(namePath, type === "school" ? "Enter the school name" : "Choose a university");
        return;
      }
      if (type === "university" && !isOther && !(universities as readonly string[]).includes(name)) {
        issue(namePath, "Choose a university from the list, or pick Other and type its name");
      }
      if (type === "school" && isOther) issue(namePath, "Only universities can be marked Other");
    };

    if (team.category !== "open") {
      checkInstitution(team.category, team.institutionName, team.institutionIsOther, ["institutionName"]);
    }

    const seenEmail = new Map<string, number>();
    const seenNic = new Map<string, number>();

    team.members.forEach((m, i) => {
      const at = (field: string): Path => ["members", i, field];

      // Which institution type does this member belong to?
      let type: InstitutionType;
      if (team.category === "open") {
        if (!m.institutionType) {
          issue(at("institutionType"), "Choose School or University");
          type = "school"; // keep checking the other fields
        } else {
          type = m.institutionType;
          checkInstitution(type, m.institutionName, m.institutionIsOther, at("institutionName"));
        }
      } else {
        type = team.category;
      }

      // NIC: every university student, nobody else
      if (type === "university") {
        if (!m.nic) issue(at("nic"), "NIC is required for university students");
        else if (!normaliseNic(m.nic)) issue(at("nic"), "Enter a valid NIC, like 123456789V or 200012345678");
        else {
          const nic = normaliseNic(m.nic)!;
          const first = seenNic.get(nic);
          if (first !== undefined) issue(at("nic"), `Same NIC as member ${first + 1}`);
          else seenNic.set(nic, i);
        }
      }

      const firstEmail = seenEmail.get(m.email);
      if (firstEmail !== undefined) issue(at("email"), `Same email as member ${firstEmail + 1}`);
      else seenEmail.set(m.email, i);
    });
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
          institutionName: fromTeam ? (teamInstitution as string) : (m.institutionName as string),
          institutionIsOther: fromTeam ? institutionIsOther : Boolean(m.institutionIsOther),
          nic: type === "university" ? normaliseNic(m.nic as string) : null,
        };
      }),
    };
  });

export type RegistrationInput = z.input<typeof registrationInputSchema>;
/** What gets stored: institutions filled in on every member, NIC normalised, positions set */
export type RegistrationData = z.output<typeof registrationInputSchema>;
export type MemberData = RegistrationData["members"][number];
