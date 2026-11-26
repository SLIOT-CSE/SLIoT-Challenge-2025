// Key dates of the 2027 edition (SLIOT '27 Master Program Calendar v5). Times are Sri Lanka time (+05:30).
// Once the backend settings are saved in admin, registrationCloses, proposalDue and prototypeDue
// are overridden from the database settings.

export const deadlines = {
  registrationOpens: "2026-11-27T09:00:00+05:30",
  registrationCloses: "2027-01-06T23:59:00+05:30",
  proposalDue: "2027-01-11T23:59:00+05:30",
  shortlistAnnounced: "2027-01-20T18:00:00+05:30",
  prototypeDue: "2027-02-06T23:59:00+05:30",
  finale: "2027-03-27T09:00:00+05:30",
} as const;

export type Deadlines = { [K in keyof typeof deadlines]: string };

/** The proposal template offered from the callout and the FAQ.
 *  TODO(2027): points at the 2025 template until the 2027 one is ready. */
export const proposalTemplateUrl = "/SLIoT%20Challenge%20-%202025%20Project%20Proposal%20Template.docx";
