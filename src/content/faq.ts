import { deadlines } from "@/content/deadlines";
import { whatsappChannel } from "@/content/socials";
import { formatDayMonth } from "@/lib/competition";

// Questions grouped by stage. Answers follow the agreed rules (docs/architecture.md).
// TODO(2027): review with the organizers; add fee, theme and venue details once confirmed.

export type Faq = { q: string; a: string; link?: { label: string; href: string } };
export type FaqGroup = { title: string; items: Faq[] };

export const faqGroups: FaqGroup[] = [
  {
    title: "Registration",
    items: [
      {
        q: "Who can take part?",
        a: "School students aged 18 or older, undergraduates at any Sri Lankan university, and mixed teams of both. Pick the School, University or Open category to match your team.",
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
        q: "Can one person be in more than one team?",
        a: "No. Each person can be in one team only, so an email address or NIC can appear in just one registration.",
      },
      {
        q: "Why do you ask university students for their NIC?",
        a: "To make sure each university student is registered in only one team. School students are not asked for it.",
      },
      {
        q: "I lost our team code. What now?",
        a: "Open the team portal and choose \"Forgot your code?\". Enter the leader's email and we send the code to that address.",
      },
    ],
  },
  {
    title: "Proposal",
    items: [
      {
        q: "What goes into the proposal?",
        a: "The problem you are solving, who it affects, and the IoT solution you plan to build. Use the proposal template so judges find everything in the same place.",
      },
      {
        q: "How do we submit it?",
        a: `Log in to the team portal with your team code and upload one PDF of up to 10 MB before ${formatDayMonth(deadlines.proposalDue)}, 11:59 pm.`,
      },
      {
        q: "Can we change our proposal after uploading it?",
        a: "Yes. Upload a new version any time before the deadline; the latest one is the one judged.",
      },
      {
        q: "How are proposals judged?",
        a: "On creativity, value, impact and technology. The strongest teams in each category are shortlisted.",
      },
    ],
  },
  {
    title: "Prototype and finale",
    items: [
      {
        q: "Who submits a prototype?",
        a: "Only shortlisted teams. You will get an email when the shortlist is announced, and the prototype form opens in your team portal.",
      },
      {
        q: "How do we submit the prototype?",
        a: "Upload a demo video to YouTube as public or unlisted, then paste the link in the team portal before the prototype deadline.",
      },
      {
        q: "When and where is the finale?",
        a: `On ${formatDayMonth(deadlines.finale)} at the University of Moratuwa. Finalists pitch their working prototypes to the judges.`,
      },
      {
        q: "Do participants get certificates?",
        a: "Yes, certificates are awarded based on the stage your team reaches.",
      },
    ],
  },
  {
    title: "Staying in touch",
    items: [
      {
        q: "Where are announcements made?",
        a: "On the official WhatsApp channel first, then on our other social channels.",
        link: { label: "Follow the WhatsApp channel", href: whatsappChannel.url },
      },
    ],
  },
];
