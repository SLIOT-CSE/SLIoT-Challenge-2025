import type { CategoryId } from "@/lib/team-rules";

// Confirmed 2027 prize money per category, in LKR. null shows "To be announced".

export type Placing = "first" | "second" | "third";

export const placings: { id: Placing; label: string; title: string; medal: string }[] = [
  { id: "first", label: "1st", title: "Champions", medal: "/images/prizes/rank-1.webp" },
  { id: "second", label: "2nd", title: "1st runners-up", medal: "/images/prizes/rank-2-clear.webp" },
  { id: "third", label: "3rd", title: "2nd runners-up", medal: "/images/prizes/rank-3-clear.webp" },
];

export const prizes: Record<CategoryId, Record<Placing, number | null>> = {
  school: { first: 120000, second: 75000, third: 50000 },
  university: { first: 175000, second: 120000, third: 75000 },
  open: { first: 175000, second: 120000, third: 75000 },
};

/** Extra awards shown under the podium; the row is hidden while this is empty. TODO(2027) */
export const specialAwards: { title: string; body: string }[] = [];

export const prizeNote = "Every category has its own podium: School, University and Open.";
