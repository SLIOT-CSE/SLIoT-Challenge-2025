// Deadlines are stored as ISO times with the Sri Lanka offset (+05:30, no daylight saving). The
// settings form uses a native datetime-local box, whose value has no offset, so these two
// functions translate between them. Everything is read and written in Sri Lanka time, whatever
// the organizer's own computer is set to.

const OFFSET = "+05:30";
const OFFSET_MS = 5.5 * 3600 * 1000;

/** `2027-03-15T23:59:00+05:30` becomes `2027-03-15T23:59` */
export function isoToInput(iso: string): string {
  return new Date(Date.parse(iso) + OFFSET_MS).toISOString().slice(0, 16);
}

/** `2027-03-15T23:59` becomes `2027-03-15T23:59:00+05:30`, or null for an empty or partial value */
export function inputToIso(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}:00${OFFSET}`))
    ? `${value}:00${OFFSET}`
    : null;
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "in 3 days", "2 hours ago", "now" */
export function formatUntil(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return "now";
  const text =
    minutes < 60
      ? plural(minutes, "minute")
      : abs < 48 * 3600 * 1000
        ? plural(Math.round(abs / 3600000), "hour")
        : plural(Math.round(abs / 86400000), "day");
  return diff > 0 ? `in ${text}` : `${text} ago`;
}
