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
    summary: "School students, one school per team",
    who: "For school students aged 18 or older. Bring your classmates and build something your school can be proud of.",
    rules: ["Teams of 1 to 5 members", "Every member from the same school", "No NIC needed"],
    cta: "Register a school team",
    institutions: "same-school",
  },
  {
    id: "university",
    name: "University",
    summary: "Undergraduates, one university per team",
    who: "For undergraduates at any Sri Lankan university, state or private. Pick your university from the list when you register.",
    rules: ["Teams of 1 to 5 members", "Every member from the same university", "NIC for every member"],
    cta: "Register a university team",
    institutions: "same-university",
  },
  {
    id: "open",
    name: "Open",
    summary: "Mix school and university students",
    who: "For mixed teams: school students and undergraduates working together, from any school or university.",
    rules: ["Teams of 1 to 5 members", "Members from different schools and universities", "NIC for university students"],
    cta: "Register an open team",
    institutions: "mixed",
  },
];
