import type { CategoryId } from "@/lib/team-rules";

// The three categories. Team rules match docs/architecture.md (decision D13).

export type Category = {
  id: CategoryId;
  name: string;
  /** One line under the name in the list */
  summary: string;
  /** Who can enter, in a sentence */
  who: string;
  rules: string[];
  /** Button label on the card */
  cta: string;
  /** How the five-seat team strip is coloured: one institution, or mixed */
  institutions: "same-school" | "same-university" | "mixed";
};

export const categories: Category[] = [
  {
    id: "school",
    name: "School",
    summary: "For Sri Lankan school innovators",
    who: "For school students across Sri Lanka. Bring your classmates together and build something your school can be proud of.",
    rules: [
      "Teams of 1 to 5 members",
      "Every member from the same school",
      "Project proposal & prototype demo video",
    ],
    cta: "Register a school team",
    institutions: "same-school",
  },
  {
    id: "university",
    name: "University",
    summary: "For undergraduate tech & engineering teams",
    who: "For undergraduates at any Sri Lankan university, state or private. Turn campus ideas into real-world IoT systems.",
    rules: [
      "Teams of 1 to 5 members",
      "Every member from the same university",
      "Project proposal & prototype demo video",
    ],
    cta: "Register a university team",
    institutions: "same-university",
  },
  {
    id: "open",
    name: "Open",
    summary: "For cross-campus and independent teams",
    who: "For mixed teams: school students and undergraduates working together, from any school or university.",
    rules: [
      "Teams of 1 to 5 members",
      "Members from different schools and universities",
      "Project proposal & prototype demo video",
    ],
    cta: "Register an open team",
    institutions: "mixed",
  },
];
