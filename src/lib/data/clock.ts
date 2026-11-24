import type { Deadlines } from "@/content/deadlines";
import type { Stage } from "@/lib/competition";

const DAY = 24 * 3600 * 1000;

/** A moment safely inside a competition stage, for the sample clock */
export function sampleTimeForStage(stage: Stage, d: Deadlines): number {
  const t = (iso: string) => Date.parse(iso);
  const mid = (from: string, to: string) => Math.round((t(from) + t(to)) / 2);

  switch (stage) {
    case "before-registration":
      return t(d.registrationOpens) - 7 * DAY;
    case "registration":
      return mid(d.registrationOpens, d.registrationCloses);
    case "proposal":
      return mid(d.registrationCloses, d.proposalDue);
    case "shortlisting":
      return mid(d.proposalDue, d.shortlistAnnounced);
    case "prototype":
      return mid(d.shortlistAnnounced, d.prototypeDue);
    case "finale":
      return t(d.finale) + 3600 * 1000;
    case "over":
      return t(d.finale) + 3 * DAY;
  }
}
