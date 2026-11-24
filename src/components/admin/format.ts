import { TIME_ZONE } from "@/lib/competition";

// Dates for the admin screens, always in Sri Lanka time

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const dayYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
const clock = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIME_ZONE });

/** "14 Mar" */
export const formatShortDay = (at: number): string => shortDay.format(at);

/** "14 Mar 2027" */
export const formatDayYear = (at: number): string => dayYear.format(at);

/** "14 Mar 2027, 3:05 pm" */
export const formatDateTime = (at: number): string => `${dayYear.format(at)}, ${clock.format(at).toLowerCase()}`;
