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
  // Covers both Grand Finale (day 1) and Shark Tank (day 2)
  if (t < Date.parse(d.finale) + 48 * 3600 * 1000) return "finale";
  return "over";
}

/** The navigation offers "Team login" from the start of the proposal round onwards.
 *  (The portal itself already accepts uploads from registered teams before that.) */
export function showsTeamLogin(stage: Stage): boolean {
  return STAGES.indexOf(stage) >= STAGES.indexOf("proposal");
}

/** While registration is still to close, the live callout counts down to that moment */
export function countsDownToRegistrationClose(stage: Stage): stage is "before-registration" | "registration" {
  return stage === "before-registration" || stage === "registration";
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** The moment has passed */
  done: boolean;
}

export function countdownParts(msLeft: number): CountdownParts {
  if (msLeft <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(msLeft / DAY),
    hours: Math.floor((msLeft % DAY) / HOUR),
    minutes: Math.floor((msLeft % HOUR) / MINUTE),
    seconds: Math.floor((msLeft % MINUTE) / SECOND),
    done: false,
  };
}

/** How far `now` is from `from` towards `to`, from 0 (not started) to 1 (reached) */
export function progressBetween(now: number, from: string, to: string): number {
  const start = Date.parse(from);
  const span = Date.parse(to) - start;
  if (span <= 0) return now >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (now - start) / span));
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
const partsShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const partsLong = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: TIME_ZONE });

/** "30 July" */
export function formatDayMonth(at: string): string {
  return dayMonth.format(new Date(at));
}

/** "11:59 pm" */
export function formatTime(at: string): string {
  return time.format(new Date(at));
}

/** { day: "30", month: "Jul" } (or "July" when `monthStyle = "long"`) for the large date display */
export function dateParts(at: string, monthStyle: "short" | "long" = "short"): { day: string; month: string } {
  const formatter = monthStyle === "long" ? partsLong : partsShort;
  const p = formatter.formatToParts(new Date(at));
  return {
    day: p.find((x) => x.type === "day")?.value ?? "",
    month: p.find((x) => x.type === "month")?.value ?? "",
  };
}
