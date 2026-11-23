import { deadlines } from "@/content/deadlines";

// The road to the finale. The key dates come from src/content/deadlines.ts (later the admin
// settings), so the timeline, the callout and the deadline locks never disagree.
//
// TODO(2027): the session and workshop dates below are samples based on the 2025 schedule.

export type TimelineEvent = { title: string; body: string; at: string };

export const timeline: TimelineEvent[] = [
  {
    title: "Registrations open",
    body: "Form your team, pick a category and register. The team leader gets a team code by email.",
    at: deadlines.registrationOpens,
  },
  {
    title: "Introductory session",
    body: "An online session on the categories, the rules and what makes a strong proposal.",
    at: "2027-01-24T18:30:00+05:30",
  },
  {
    title: "Registrations close",
    body: "The last day to register a team. Proposals can still be uploaded until they are due.",
    at: deadlines.registrationCloses,
  },
  {
    title: "Proposals due",
    body: "Upload your proposal as one PDF from the team portal before 11:59 pm.",
    at: deadlines.proposalDue,
  },
  {
    title: "Shortlist announced",
    body: "Shortlisted teams get an email and can start on their prototype.",
    at: deadlines.shortlistAnnounced,
  },
  {
    title: "Prototype workshops",
    body: "Hands-on sessions for shortlisted teams with mentors from industry and the university.",
    at: "2027-04-24T09:00:00+05:30",
  },
  {
    title: "Prototypes due",
    body: "Submit the YouTube link to your demo video from the team portal.",
    at: deadlines.prototypeDue,
  },
  {
    title: "Finalists announced",
    body: "The teams going to the finale hear by email, and the list goes up here.",
    at: "2027-06-25T18:00:00+05:30",
  },
  {
    title: "Grand finale",
    body: "Finalists pitch their working prototypes to the judges at the University of Moratuwa.",
    at: deadlines.finale,
  },
];
