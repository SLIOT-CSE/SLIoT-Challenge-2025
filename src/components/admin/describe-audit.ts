import type { AuditEntryView, FieldChange } from "@/lib/data";

// Audit entries as sentences a person can read. The data layer stores action names and details;
// this is the screen's wording, shared by the team drawer and the Audit log. Unknown actions
// still read as something, never as an empty row.

export interface AuditDescription {
  /** One sentence: who did what */
  text: string;
  /** Extra lines, e.g. each field a team edit changed */
  detail: string[];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function actorOf(entry: AuditEntryView): string {
  if (entry.actorName) return entry.actorName;
  if (entry.actorType === "team") return "The team";
  if (entry.actorType === "admin") return "An organizer";
  if (entry.actorType === "system") return "The system";
  return "Someone";
}

/** `member2.email` becomes "Member 2 email" */
export function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    name: "Team name",
    institutionName: "Institution",
    institutionIsOther: "Institution not in the list",
    fullName: "name",
    whatsapp: "WhatsApp number",
    email: "email",
    nic: "NIC",
    institutionType: "institution type",
    registrationCloses: "Registration closes",
    proposalDue: "Proposals due",
    prototypeDue: "Prototypes due",
  };
  const member = /^member(\d)\.(.+)$/.exec(field);
  if (member) {
    const what = labels[member[2]] ?? member[2];
    // "Member 2 institution name" reads better than "Member 2 Institution"
    return `Member ${member[1]} ${member[2] === "institutionName" ? "institution name" : what}`;
  }
  return labels[field] ?? field;
}

const show = (value: string | null) => (value === null || value === "" ? "empty" : `“${value}”`);

function changesOf(entry: AuditEntryView): FieldChange[] {
  const raw = entry.details?.changes;
  return Array.isArray(raw) ? (raw as FieldChange[]) : [];
}

function countOf(entry: AuditEntryView, key = "count"): number {
  const value = entry.details?.[key];
  return typeof value === "number" ? value : 0;
}

export function describeAudit(entry: AuditEntryView): AuditDescription {
  const actor = actorOf(entry);
  const d = entry.details;
  const plain = (text: string): AuditDescription => ({ text, detail: [] });

  switch (entry.action) {
    case "team.registered":
      return plain("The team registered");
    case "team.login":
      return plain("The team logged in");
    case "team.login_failed":
      return plain("Someone tried a wrong team code");
    case "team.code_reminder_requested":
      return plain("A team code reminder was requested");
    case "team.code_reminder":
      return plain("The team code was emailed to the team leader");
    case "team.code_resent":
      return plain(`${actor} emailed the team code to the team leader again`);
    case "team.deleted":
      return plain(`The team${typeof d?.name === "string" ? ` “${d.name}”` : ""} was deleted on the server`);
    case "team.edited":
      return {
        text: `${actor} edited the team's details`,
        detail: changesOf(entry).map((c) => `${fieldLabel(c.field)}: ${show(c.from)} → ${show(c.to)}`),
      };
    case "proposal.uploaded":
      return plain(`The team uploaded proposal version ${d?.version ?? "?"}`);
    case "prototype.submitted":
      return plain(`The team submitted its prototype link (version ${d?.version ?? "?"})`);

    case "shortlist.marked":
      return plain(`${actor} ${d?.marked === false ? "unticked" : "ticked"} ${plural(countOf(entry), "team")} on the draft shortlist`);
    case "shortlist.finalised":
      return plain(
        `${actor} finalised the shortlist: ${plural(countOf(entry, "shortlistedCount"), "team")} shortlisted, ${plural(countOf(entry, "newlyEmailedCount"), "email")} sent`,
      );
    case "shortlist.reopened":
      return plain(`${actor} reopened the shortlist`);
    case "finalists.announced":
      return plain(`${actor} announced ${plural(countOf(entry), "finalist")}, ${plural(countOf(entry, "newlyEmailedCount"), "email")} sent`);
    case "finalists.unmarked":
      return plain(`${actor} removed ${plural(countOf(entry), "team")} from the finalists`);

    case "settings.updated":
      return {
        text: `${actor} changed the deadlines`,
        detail: changesOf(entry).map((c) => `${fieldLabel(c.field)}: ${show(c.from)} → ${show(c.to)}`),
      };

    case "admin.login":
      return plain(`${actor} signed in`);
    case "admin.login_failed":
      return plain(`A failed sign-in for “${typeof d?.username === "string" ? d.username : "?"}”`);
    case "admin.created":
      return plain(`${actor} created the ${d?.role === "super_admin" ? "super admin" : "admin"} account “${d?.username ?? "?"}”`);
    case "admin.password_reset":
      return plain(`${actor} generated a new password for an organizer`);
    case "admin.role_changed":
      return plain(`${actor} changed an organizer's role from ${d?.from} to ${d?.to}`);
    case "admin.disabled":
      return plain(`${actor} disabled an organizer account`);
    case "admin.enabled":
      return plain(`${actor} enabled an organizer account`);

    case "export.csv":
      return plain(`${actor} downloaded a CSV of ${plural(countOf(entry), "team")}`);
    case "export.sheets":
      return plain(`${actor} exported ${plural(countOf(entry), "team")} to Google Sheets`);

    default:
      return plain(`${actor}: ${entry.action}`);
  }
}
