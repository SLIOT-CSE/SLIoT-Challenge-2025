import type { Deadlines } from "@/content/deadlines";
import { formatDayMonth, formatTime } from "@/lib/competition";

// One list, in the order a team meets them: registration, proposal, prototype.
// Answers follow the agreed rules (docs/architecture.md).
// TODO(2027): review with the organizers; add fee, theme and venue details once confirmed.

export type Faq = { q: string; a: string; link?: { label: string; href: string } };

export function faqsFor(deadlines: Deadlines): Faq[] {
  return [
    {
      q: "Who can take part?",
      a: "School students, undergraduates at any Sri Lankan university, and mixed teams of both. Pick the School, University or Open category to match your team.",
    },
    {
      q: "How many members can a team have?",
      a: "Between 1 and 5, including the team leader. The leader registers the team and receives every email.",
    },
    {
      q: "Do all members need to be from the same school or university?",
      a: "Yes for the School and University categories. If your team mixes schools, universities, or school and university students, choose the Open category.",
    },
    {
      q: "How do we submit the proposal?",
      a: `Log in to the team portal with your team code and upload one PDF of up to 10 MB before ${formatDayMonth(deadlines.proposalDue)}, ${formatTime(deadlines.proposalDue)}.`,
    },
    {
      q: "Can we change our proposal after uploading it?",
      a: "Yes. Upload a new version any time before the deadline; the latest one is the one judged.",
    },
    {
      q: "How do we submit the prototype?",
      a: "Upload a demo video to YouTube as public or unlisted, then paste the link in the team portal before the prototype deadline.",
    },
  ];
}
