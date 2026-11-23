// Key dates of the 2027 edition. Times are Sri Lanka time (+05:30).
//
// TODO(2027): sample dates. Replace with the real ones; once the backend exists the
// registration, proposal and prototype dates come from the admin settings instead.

export const deadlines = {
  registrationOpens: "2027-01-10T09:00:00+05:30",
  registrationCloses: "2027-02-28T23:59:00+05:30",
  proposalDue: "2027-03-15T23:59:00+05:30",
  shortlistAnnounced: "2027-04-05T18:00:00+05:30",
  prototypeDue: "2027-06-15T23:59:00+05:30",
  finale: "2027-07-10T09:00:00+05:30",
} as const;

export type Deadlines = { [K in keyof typeof deadlines]: string };

/** The proposal template offered from the callout and "How to take part". TODO(2027): real file */
export const proposalTemplateUrl = "/downloads/sliot-2027-proposal-template.docx";
