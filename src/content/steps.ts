import { proposalTemplateUrl, type Deadlines } from "@/content/deadlines";

// "How to take part": the five stages of the competition, in order.

export type Step = {
  title: string;
  body: string;
  /** The date shown on the step, and how it is introduced ("Closes", "Due" ...) */
  date: { key: keyof Deadlines; label: string };
  /** Optional link under the step */
  link?: { label: string; href: string; download?: boolean };
};

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
    link: { label: "Proposal template", href: proposalTemplateUrl, download: true },
  },
  {
    title: "Get shortlisted",
    body: "Judges score every proposal on creativity, value, impact and technology. Shortlisted teams get an email.",
    date: { key: "shortlistAnnounced", label: "Announced" },
  },
  {
    title: "Build your prototype",
    body: "Build it, record a demo video and submit the YouTube link from the team portal, with workshops and mentors along the way.",
    date: { key: "prototypeDue", label: "Due" },
  },
  {
    title: "Pitch at the finale",
    body: "Finalists present their working prototypes to the judges at the University of Moratuwa.",
    date: { key: "finale", label: "On" },
  },
];
