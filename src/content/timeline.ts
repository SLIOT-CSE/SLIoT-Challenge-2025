import { deadlines } from "@/content/deadlines";

// The road to the finale (SLIOT '27 Master Program Calendar v5). The core deadline anchors come
// from src/content/deadlines.ts (later overridden by admin settings), so the timeline, the
// callout and the deadline locks never disagree.

export type TimelineEvent = { title: string; body: string; at: string };

export const timeline: TimelineEvent[] = [
  {
    title: "Registrations open",
    body: "Form your team of 1 to 5, pick your category and register. The team leader gets a team code by email.",
    at: deadlines.registrationOpens,
  },
  {
    title: "Official awareness session",
    body: "Kickoff session covering the competition roadmap, categories, rules, Semi-Finals, Finale, and Shark Tank Q&A.",
    at: "2026-12-12T19:00:00+05:30",
  },
  {
    title: "Proposal submissions open",
    body: "The team portal opens for registered teams to upload their project proposal PDF while registrations continue.",
    at: "2026-12-21T09:00:00+05:30",
  },
  {
    title: "Proposal awareness session",
    body: "Walkthrough of the proposal template, technical feasibility expectations, and judging rubric before submissions close.",
    at: "2027-01-02T19:00:00+05:30",
  },
  {
    title: "Registrations close",
    body: "Final day to register a team for SLIoT '27. Registered teams can keep refining proposals until the submission cutoff.",
    at: deadlines.registrationCloses,
  },
  {
    title: "Proposals due",
    body: "Upload your completed proposal as one PDF from the team portal before 11:59 pm.",
    at: deadlines.proposalDue,
  },
  {
    title: "Proposal results announced",
    body: "Shortlisted teams advancing to the prototype video round are notified by email.",
    at: deadlines.shortlistAnnounced,
  },
  {
    title: "Video submissions open",
    body: "Shortlisted teams gain portal access to submit their prototype demo video, with guidance on the Shark Tank round.",
    at: "2027-01-21T09:00:00+05:30",
  },
  {
    title: "Video submissions close",
    body: "Upload your prototype demo video to YouTube and submit the link in the team portal before 11:59 pm.",
    at: deadlines.prototypeDue,
  },
  {
    title: "Semi-finalists announced",
    body: "Video evaluation results are released and the official SLIoT '27 semi-finalist teams are revealed.",
    at: "2027-02-17T18:00:00+05:30",
  },
  {
    title: "Pre-semi-finals workshop",
    body: "In-person technical teaching session for semi-finalists focused on prototype refinement and stage presentation.",
    at: "2027-02-21T09:00:00+05:30",
  },
  {
    title: "Semi-finalist briefing",
    body: "Mandatory event briefing covering semi-final rules, judging sequence, and event-day logistics.",
    at: "2027-02-25T19:00:00+05:30",
  },
  {
    title: "Semi-finals & finalist reveal",
    body: "Semi-finalists compete live, with Grand Finalists advancing to Finale weekend announced on the same day.",
    at: "2027-02-27T09:00:00+05:30",
  },
  {
    title: "Shark Tank coaching — Session 1",
    body: "First in-person pitch coaching for Grand Finalists covering business models, pricing, and mock investor Q&A.",
    at: "2027-03-06T09:00:00+05:30",
  },
  {
    title: "Shark Tank coaching — Session 2",
    body: "Full investor pitch dress rehearsal and commercial ask polish ahead of Finale weekend.",
    at: "2027-03-13T09:00:00+05:30",
  },
  {
    title: "SLIoT '27 Grand Finale",
    body: "Grand Finalists present their finished IoT innovations to the judging panel at the University of Moratuwa.",
    at: deadlines.finale,
  },
  {
    title: "SLIoT '27 Shark Tank",
    body: "Grand Finalists pitch their IoT products and commercial models directly to industry leaders and investors.",
    at: "2027-03-28T09:00:00+05:30",
  },
];
