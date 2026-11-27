import { z } from "zod";
import { deadlines as contentDeadlines } from "@/content/deadlines";
import { text } from "./fields";

// Organizer accounts and the deadline settings (docs/architecture.md, 5 and 6.5).

export const adminRoleSchema = z.enum(["super_admin", "admin"]);

export const newAdminSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9._-]{2,29}$/, {
      error: "Use 3 to 30 letters, numbers, dots, dashes or underscores, starting with a letter or number",
    }),
  displayName: text("Display name", 2, 60),
  role: adminRoleSchema,
});

export type NewAdminData = z.output<typeof newAdminSchema>;

/** A deadline as an ISO time with an offset, like `2027-03-15T23:59:00+05:30` */
const deadlineSchema = z
  .string({ error: "Enter a date and time" })
  .refine((value) => /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value)), {
    error: "Enter a valid date and time",
  });

export const deadlineSettingsSchema = z
  .object({
    registrationCloses: deadlineSchema,
    proposalDue: deadlineSchema,
    prototypeDue: deadlineSchema,
  })
  .superRefine((d, ctx) => {
    const closes = Date.parse(d.registrationCloses);
    const proposal = Date.parse(d.proposalDue);
    const prototype = Date.parse(d.prototypeDue);
    if (proposal <= closes) {
      ctx.addIssue({ code: "custom", path: ["proposalDue"], message: "Proposals must be due after registration closes" });
    }
    if (proposal <= Date.parse(contentDeadlines.proposalOpens)) {
      ctx.addIssue({ code: "custom", path: ["proposalDue"], message: "Proposals must be due after submissions open" });
    }
    if (prototype <= proposal) {
      ctx.addIssue({ code: "custom", path: ["prototypeDue"], message: "Prototypes must be due after proposals" });
    }
  });
