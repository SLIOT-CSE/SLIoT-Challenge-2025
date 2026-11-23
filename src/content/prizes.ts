import type { CategoryId } from "@/lib/team-rules";

// Prize money per category, in LKR. null shows "To be announced".
// TODO(2027): real amounts. Never ship sample figures as if they were real.

export type Placing = "first" | "second" | "third";

export const placings: { id: Placing; label: string; title: string; medal: string }[] = [
  { id: "first", label: "1st", title: "Champions", medal: "/images/prizes/first.png" },
  { id: "second", label: "2nd", title: "1st runners-up", medal: "/images/prizes/second.png" },
  { id: "third", label: "3rd", title: "2nd runners-up", medal: "/images/prizes/third.png" },
];

export const prizes: Record<CategoryId, Record<Placing, number | null>> = {
  school: { first: null, second: null, third: null },
  university: { first: null, second: null, third: null },
  open: { first: null, second: null, third: null },
};

/** Extra awards shown under the podium; the row is hidden while this is empty. TODO(2027) */
export const specialAwards: { title: string; body: string }[] = [];

export const prizeNote = "Every category has its own podium: School, University and Open.";
