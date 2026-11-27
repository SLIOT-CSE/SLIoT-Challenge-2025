import type { Deadlines } from "@/content/deadlines";
import { formatTime } from "@/lib/competition";

// The road to the finale (SLIOT '27 Master Program Calendar v5). The core deadline anchors are
// passed in: on the public page they are the ones saved in /admin/settings (falling back to
// src/content/deadlines.ts), so the timeline, the callout and the deadline locks never disagree.

export type TimelineEvent = { title: string; body: string; at: string; dateTba?: boolean };

/** Every milestone in date order, so a moved deadline lands in the right place */
export function timelineFor(deadlines: Deadlines): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      title: "Registrations open",
      body: "Form your team of 1 to 5, pick your category and register. The team leader gets a team code by email.",
      at: deadlines.registrationOpens,
    },
    {
      title: "Official awareness session",
      body: "Kickoff session covering the competition roadmap, categories, rules, Semi-Finals, Finale, and Q&A.",
      at: "2026-12-12T19:00:00+05:30",
    },
    {
      title: "Proposal submissions open",
      body: "The team portal opens for registered teams to upload their project proposal PDF.",
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
      title: "Proposal submissions close",
      body: `Upload your completed proposal as one PDF from the team portal before ${formatTime(deadlines.proposalDue)}.`,
      at: deadlines.proposalDue,
    },
    {
      title: "Video submissions open",
      body: "Shortlisted teams gain portal access to submit their prototype demo video.",
      at: "2027-01-21T09:00:00+05:30",
    },
    {
      title: "Video submissions close",
      body: `Upload your prototype demo video to YouTube and submit the link in the team portal before ${formatTime(deadlines.prototypeDue)}.`,
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
      title: "Semi-finals",
      body: "Semi-finalists pitch live prototypes; judges score the round and announce Grand Finalists the same day.",
      at: "2027-02-27T09:00:00+05:30",
    },
    {
      title: "SLIoT '27 Grand Finale",
      body: "Grand Finalists present their finished IoT innovations to the judging panel at the University of Moratuwa.",
      at: deadlines.finale,
    },
    {
      title: "SLIoT '27 Awarding Ceremony",
      body: "Category champions and award winners from the School, University, and Open tracks are honored and presented with their awards. Time TBA.",
      at: "2027-03-28T09:00:00+05:30",
      dateTba: true,
    },
  ];
  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
