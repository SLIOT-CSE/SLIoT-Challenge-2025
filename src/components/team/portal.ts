import { formatDayMonth, formatTime } from "@/lib/competition";
import type { CompetitionState, Submission, TeamDetail } from "@/lib/data";
import { hasPdfHeader } from "@/lib/schemas";
import { MAX_PROPOSAL_BYTES, type TeamStage } from "@/lib/team-rules";

// What the team portal shows for a team in a competition state, with no React in it.

// ---- Status tracker ----

export type TrackerId = "registered" | "proposal" | "shortlist" | "prototype" | "finals";
/**
 * done: passed · current: where the team is · upcoming: still ahead
 * stopped: the team's journey ended here (not shortlisted) · off: ahead, but out of reach
 */
export type TrackerStatus = "done" | "current" | "upcoming" | "stopped" | "off";

export interface TrackerStep {
  id: TrackerId;
  label: string;
  status: TrackerStatus;
}

const ORDER: TrackerId[] = ["registered", "proposal", "shortlist", "prototype", "finals"];
const LABEL: Record<TrackerId, string> = {
  registered: "Registered",
  proposal: "Proposal",
  shortlist: "Shortlist",
  prototype: "Prototype",
  finals: "Finals",
};

/** Which milestone a team is on. A not-shortlisted team stops at Shortlist */
const CURRENT: Record<TeamStage, TrackerId> = {
  registered: "registered",
  proposal_submitted: "proposal",
  shortlisted: "shortlist",
  not_shortlisted: "shortlist",
  prototype_submitted: "prototype",
  finalist: "finals",
};

export function trackerFor(stage: TeamStage): TrackerStep[] {
  const at = ORDER.indexOf(CURRENT[stage]);
  const stopped = stage === "not_shortlisted";

  return ORDER.map((id, i) => {
    let status: TrackerStatus;
    if (i < at) status = "done";
    else if (i === at) status = stopped ? "stopped" : "current";
    else status = stopped ? "off" : "upcoming";
    return { id, label: stopped && id === "shortlist" ? "Not shortlisted" : LABEL[id], status };
  });
}

// ---- Proposal panel ----

const BEFORE_DECISION: TeamStage[] = ["registered", "proposal_submitted"];
const SHORTLISTED: TeamStage[] = ["shortlisted", "prototype_submitted"];

export type ProposalLock = null | "deadline" | "decided";

export interface ProposalPanelState {
  /** The drop zone is available */
  canUpload: boolean;
  /**
   * deadline: the due date has passed · decided: the team has a shortlist result, so the
   * proposal is final. Null while uploads are open.
   */
  lock: ProposalLock;
  /** Registration is still open: an early upload is allowed, and the panel says so */
  early: boolean;
  dueAt: string;
  current: Submission | null;
  /** Older versions, newest first */
  history: Submission[];
}

export function proposalPanel(team: TeamDetail, comp: CompetitionState): ProposalPanelState {
  const dueAt = comp.deadlines.proposalDue;
  const proposals = team.submissions.filter((s) => s.kind === "proposal");

  let lock: ProposalLock = null;
  if (comp.now > Date.parse(dueAt)) lock = "deadline";
  else if (!BEFORE_DECISION.includes(team.stage)) lock = "decided";

  return {
    canUpload: lock === null,
    lock,
    early: comp.stage === "registration" || comp.stage === "before-registration",
    dueAt,
    current: team.proposal,
    history: proposals.filter((s) => !s.isCurrent),
  };
}

// ---- Prototype panel ----

export type PrototypePanelState =
  /** Not shortlisted yet: locked, with the date the shortlist is due */
  | { kind: "waiting"; announcedAt: string }
  /** The shortlist said no: a kind message and no panel */
  | { kind: "not-shortlisted" }
  /** Shortlisted and the deadline is ahead: the link field */
  | { kind: "open"; dueAt: string; current: Submission | null }
  /** Shortlisted, deadline gone */
  | { kind: "closed"; dueAt: string; current: Submission | null }
  /** A finalist: the prototype is final */
  | { kind: "finalist"; current: Submission | null };

export function prototypePanel(team: TeamDetail, comp: CompetitionState): PrototypePanelState {
  const dueAt = comp.deadlines.prototypeDue;
  switch (team.stage) {
    case "registered":
    case "proposal_submitted":
      return { kind: "waiting", announcedAt: comp.deadlines.shortlistAnnounced };
    case "not_shortlisted":
      return { kind: "not-shortlisted" };
    case "finalist":
      return { kind: "finalist", current: team.prototype };
    default:
      return SHORTLISTED.includes(team.stage) && comp.now <= Date.parse(dueAt)
        ? { kind: "open", dueAt, current: team.prototype }
        : { kind: "closed", dueAt, current: team.prototype };
  }
}

// ---- Countdown ----

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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "12 days 4 hours", "3 hours 20 minutes", "4 minutes 10 seconds", "Deadline passed" */
export function formatCountdown(msLeft: number): string {
  const p = countdownParts(msLeft);
  if (p.done) return "Deadline passed";
  if (p.days > 0) return `${plural(p.days, "day")} ${plural(p.hours, "hour")}`;
  if (p.hours > 0) return `${plural(p.hours, "hour")} ${plural(p.minutes, "minute")}`;
  return `${plural(p.minutes, "minute")} ${plural(p.seconds, "second")}`;
}

export type CountdownTone = "calm" | "soon" | "urgent" | "over";

/** Under a day is urgent, under three days is soon */
export function countdownTone(msLeft: number): CountdownTone {
  if (msLeft <= 0) return "over";
  if (msLeft <= DAY) return "urgent";
  if (msLeft <= 3 * DAY) return "soon";
  return "calm";
}

// ---- Formatting ----

/** "15 March, 11:59 pm" in Sri Lanka time, from an ISO string or a timestamp */
export function formatWhen(at: string | number): string {
  const iso = typeof at === "number" ? new Date(at).toISOString() : at;
  return `${formatDayMonth(iso)}, ${formatTime(iso)}`;
}

/** "850 KB", "2.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "15 minutes", "1 minute", "40 seconds" */
export function formatWait(seconds: number): string {
  if (seconds >= 60) return plural(Math.ceil(seconds / 60), "minute");
  return plural(Math.max(1, Math.ceil(seconds)), "second");
}

export const youtubeThumbnail = (id: string): string => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// ---- Proposal file checks (before anything is uploaded) ----

export interface PickedFile {
  name: string;
  size: number;
}

export type FileCheck = { ok: true } | { ok: false; message: string };

/** The first bytes of a file, for the `%PDF-` check */
export async function readHeader(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, 5).arrayBuffer());
}

/** Each way a file can be wrong gets its own message. `header` is the file's first bytes, when read */
export function checkProposalFile(file: PickedFile, header?: Uint8Array): FileCheck {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, message: "Only PDF files are accepted. Save your proposal as a PDF and try again." };
  }
  if (file.size === 0) return { ok: false, message: "That file is empty." };
  if (file.size > MAX_PROPOSAL_BYTES) {
    return {
      ok: false,
      message: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_PROPOSAL_BYTES)}.`,
    };
  }
  if (header && !hasPdfHeader(header)) {
    return { ok: false, message: "That file has a .pdf name but isn't a real PDF. Export it again as a PDF." };
  }
  return { ok: true };
}
