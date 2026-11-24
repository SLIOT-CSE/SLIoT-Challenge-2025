import { CATEGORY_LABELS, TEAM_SIZE, TEAM_STAGE_LABELS, type TeamStage } from "@/lib/team-rules";
import type { ShortlistState, TeamRow } from "./types";

// The teams export (docs/architecture.md, 6.7): one row per team, team columns first, then
// M1 to M5 member columns (M1 is the leader). UTF-8 with a byte-order mark so Excel shows
// Sinhala and Tamil names correctly. Pure, so the same code can run on the server later.

const BOM = "﻿";
const NEWLINE = "\r\n";
const COLOMBO_OFFSET_MS = 5.5 * 3600 * 1000;

const SHORTLISTED: TeamStage[] = ["shortlisted", "prototype_submitted", "finalist"];

/** `2027-03-15 23:59`, in Sri Lanka time */
export function formatColomboTime(ms: number): string {
  return new Date(ms + COLOMBO_OFFSET_MS).toISOString().slice(0, 16).replace("T", " ");
}

/**
 * One CSV cell. Quotes when needed, and defuses spreadsheet formulas: a text that starts with
 * = or @ (or + or - followed by anything but digits and spaces) gets a leading apostrophe.
 * Phone numbers like +94700000001 are left alone.
 */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=@\t\r]/.test(text) || /^[+-](?![\d\s]*$)/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export interface TeamsCsvOptions {
  /** The result column exists only once the list is published */
  shortlistState: ShortlistState;
}

export function shortlistResult(team: Pick<TeamRow, "stage">): string {
  if (SHORTLISTED.includes(team.stage)) return "Shortlisted";
  if (team.stage === "not_shortlisted") return "Not shortlisted";
  return "";
}

export function buildTeamsCsv(teams: TeamRow[], { shortlistState }: TeamsCsvOptions): string {
  const withResult = shortlistState === "finalised";

  const header = [
    "Team code",
    "Team name",
    "Category",
    "Institution",
    "Stage",
    ...(withResult ? ["Shortlist result"] : []),
    "Proposal link",
    "Proposal version",
    "Video link",
    "Registered",
    "Last updated",
  ];
  for (let m = 1; m <= TEAM_SIZE.max; m++) {
    header.push(`M${m} name`, `M${m} WhatsApp`, `M${m} email`, `M${m} institution`, `M${m} NIC`);
  }

  const lines = [header.map(csvCell).join(",")];
  for (const t of teams) {
    const cells: (string | number | null)[] = [
      t.code,
      t.name,
      CATEGORY_LABELS[t.category],
      t.institutionName,
      TEAM_STAGE_LABELS[t.stage],
      ...(withResult ? [shortlistResult(t)] : []),
      t.proposal?.driveUrl ?? null,
      t.proposal?.version ?? null,
      t.prototype?.youtubeUrl ?? null,
      formatColomboTime(t.createdAt),
      formatColomboTime(t.updatedAt),
    ];
    // Member columns stay empty for teams smaller than five
    for (let i = 0; i < TEAM_SIZE.max; i++) {
      const m = t.members[i];
      cells.push(m?.fullName ?? null, m?.whatsapp ?? null, m?.email ?? null, m?.institutionName ?? null, m?.nic ?? null);
    }
    lines.push(cells.map(csvCell).join(","));
  }

  return BOM + lines.join(NEWLINE) + NEWLINE;
}

/** `sliot-teams-2027-03-15-2359.csv` */
export function teamsCsvFileName(now: number): string {
  return `sliot-teams-${formatColomboTime(now).replace(" ", "-").replace(":", "")}.csv`;
}
