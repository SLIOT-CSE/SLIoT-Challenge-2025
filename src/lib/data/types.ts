import type { Deadlines } from "@/content/deadlines";
import type { CategoryId, InstitutionType, SubmissionKind, TeamStage } from "@/lib/team-rules";

// Records and results of the data layer. Shapes follow docs/architecture.md, section 5,
// with times as Unix milliseconds. The backend returns the same shapes.

export interface Team {
  id: number;
  code: string;
  name: string;
  category: CategoryId;
  institutionName: string | null;
  institutionIsOther: boolean;
  stage: TeamStage;
  /** Draft tick by a super admin. Hidden from teams and admins until finalised */
  shortlistMark: boolean;
  shortlistEmailedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Member {
  id: number;
  teamId: number;
  /** 1 to 5. 1 is the team leader */
  position: number;
  fullName: string;
  whatsapp: string;
  email: string;
  institutionType: InstitutionType;
  institutionName: string;
  institutionIsOther: boolean;
  nic: string | null;
}

export interface Submission {
  id: number;
  teamId: number;
  kind: SubmissionKind;
  version: number;
  isCurrent: boolean;
  submittedAt: number;
  // proposals
  fileName: string | null;
  sizeBytes: number | null;
  driveUrl: string | null;
  // prototypes
  youtubeId: string | null;
  youtubeUrl: string | null;
}

export type ShortlistState = "draft" | "finalised";

export interface Settings {
  /** The sample clock. null means the real clock. Set from the dev switcher */
  now: number | null;
  shortlistState: ShortlistState;
  deadlines: Deadlines;
  /** Sample only: when on, every data call fails with a NetworkError. Set from the dev switcher */
  simulateNetworkError?: boolean;
}

export interface ShortlistFinalisation {
  id: number;
  finalisedBy: number;
  finalisedByName: string;
  finalisedAt: number;
  shortlistedCount: number;
  newlyEmailedCount: number;
  teamIds: number[];
}

export type EmailTemplate =
  | "registration_confirmed"
  | "code_reminder"
  | "proposal_received"
  | "shortlisted"
  | "prototype_received";

export interface OutboxEmail {
  id: number;
  teamId: number | null;
  toEmail: string;
  template: EmailTemplate;
  props: Record<string, string>;
  status: "pending" | "sent";
  createdAt: number;
}

export type ActorType = "team" | "admin" | "system" | "anonymous";

export interface AuditEntry {
  id: number;
  actorType: ActorType;
  actorId: number | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: number;
}

/** Who is doing an admin action */
export interface AdminActor {
  id: number;
  name: string;
}

// Joined views the screens use

export interface TeamRow extends Team {
  /** In position order. Member 1 is the leader */
  members: Member[];
  proposal: Submission | null;
  prototype: Submission | null;
}

export interface TeamDetail extends TeamRow {
  /** Every version, newest first */
  submissions: Submission[];
}

export interface TeamFilter {
  category?: CategoryId;
  stage?: TeamStage;
  /** Matches team name, team code, member name, email or NIC */
  search?: string;
}

// Results

export type ErrorCode =
  | "invalid_input"
  | "duplicate_member"
  | "registration_not_open"
  | "registration_closed"
  | "invalid_code"
  | "not_logged_in"
  | "not_allowed"
  | "proposal_deadline_passed"
  | "prototype_deadline_passed"
  | "shortlist_finalised"
  | "shortlist_not_finalised"
  | "no_proposal"
  | "confirmation_required";

export interface FieldIssue {
  /** e.g. `members.2.email` */
  path: string;
  message: string;
}

export interface Conflict {
  field: "email" | "nic";
  /** The member to fix, 1 to 5 */
  memberPosition: number;
}

export interface DataError {
  code: ErrorCode;
  message: string;
  issues?: FieldIssue[];
  conflicts?: Conflict[];
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: DataError };
