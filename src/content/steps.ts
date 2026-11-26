import type { Deadlines } from "@/content/deadlines";

// "How to take part": the six stages of the competition, in ascending order.

export type StepDate =
  | { key: keyof Deadlines; label: string }
  | { at: string; label: string };

export type Step = {
  title: string;
  body: string;
  /** The date shown on the step, and how it is introduced ("Closes", "Due" ...) */
  date: StepDate;
};

export function resolveStepDate(date: StepDate, deadlines: Deadlines): string {
  return "key" in date ? deadlines[date.key] : date.at;
}

export const steps: Step[] = [
  {
    title: "Register your team",
    body: "Form a team of 1 to 5, pick your category and register. The team leader gets a team code by email.",
    date: { key: "registrationCloses", label: "Closes" },
  },
  {
    title: "Submit your proposal",
    body: "Describe the problem and your IoT solution in the proposal template, then upload it as a PDF from the team portal.",
    date: { key: "proposalDue", label: "Due" },
  },
  {
    title: "Get shortlisted",
    body: "Judges score every proposal on creativity, value, impact and technology. Shortlisted teams get an email.",
    date: { key: "shortlistAnnounced", label: "Announced" },
  },
  {
    title: "Build your prototype",
    body: "Build it, record a demo video and submit the YouTube link from the team portal, with technical sessions along the way.",
    date: { key: "prototypeDue", label: "Due" },
  },
  {
    title: "Compete in the semi-finals",
    body: "Selected semi-finalists demonstrate their working prototypes live for a same-day spot in the Grand Finale.",
    date: { at: "2027-02-27T09:00:00+05:30", label: "On" },
  },
  {
    title: "Pitch at the finale",
    body: "Grand Finalists present to the judging panel on 27 March and pitch to investors at Shark Tank on 28 March.",
    date: { key: "finale", label: "On" },
  },
];
