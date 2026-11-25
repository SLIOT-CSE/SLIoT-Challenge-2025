import type { Deadlines } from "@/content/deadlines";

// Where the competition stands at a given moment, worked out from the key dates.
// Drives the live callout and which buttons the navigation shows.

export type Stage =
  | "before-registration"
  | "registration"
  | "proposal"
  | "shortlisting"
  | "prototype"
  | "finale"
  | "over";

export const STAGES: Stage[] = [
  "before-registration",
  "registration",
  "proposal",
  "shortlisting",
  "prototype",
  "finale",
  "over",
];

export const TIME_ZONE = "Asia/Colombo";

export function stageAt(now: Date, d: Deadlines): Stage {
  const t = now.getTime();
  if (t < Date.parse(d.registrationOpens)) return "before-registration";
  if (t <= Date.parse(d.registrationCloses)) return "registration";
  if (t <= Date.parse(d.proposalDue)) return "proposal";
  if (t < Date.parse(d.shortlistAnnounced)) return "shortlisting";
  if (t <= Date.parse(d.prototypeDue)) return "prototype";
  if (t < Date.parse(d.finale) + 24 * 3600 * 1000) return "finale";
  return "over";
}

/** The navigation offers "Team login" from the start of the proposal round onwards.
 *  (The portal itself already accepts uploads from registered teams before that.) */
export function showsTeamLogin(stage: Stage): boolean {
  return STAGES.indexOf(stage) >= STAGES.indexOf("proposal");
}

/** Whole days from now until `at` (0 on the day itself), never negative */
export function daysUntil(now: Date, at: string): number {
  const ms = Date.parse(at) - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
}

/** "in 12 days", "tomorrow", "today" */
export function relativeDays(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: TIME_ZONE });
const time = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIME_ZONE });
const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });

/** "30 July" */
export function formatDayMonth(at: string): string {
  return dayMonth.format(new Date(at));
}

/** "11:59 pm" */
export function formatTime(at: string): string {
  return time.format(new Date(at));
}

/** { day: "30", month: "Jul" } for the large date display */
export function dateParts(at: string): { day: string; month: string } {
  const p = parts.formatToParts(new Date(at));
  return {
    day: p.find((x) => x.type === "day")?.value ?? "",
    month: p.find((x) => x.type === "month")?.value ?? "",
  };
}
