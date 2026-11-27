import type { Deadlines } from "@/content/deadlines";
import type { Stage } from "@/lib/competition";
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
  /** When the "you're a finalist" email was queued. Stops a second announce from emailing again */
  finalistEmailedAt: number | null;
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
  shortlistState: ShortlistState;
  deadlines: Deadlines;
  /** When "Export to Sheets" last ran (architecture: `last_sheet_export_at`) */
  lastSheetExportAt: number | null;
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
  | "prototype_received"
  | "finalist";

export interface OutboxEmail {
  id: number;
  teamId: number | null;
  toEmail: string;
  template: EmailTemplate;
  props: Record<string, string>;
  /** `failed` after the last retry; shown in the dashboard */
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError: string | null;
  createdAt: number;
  sentAt: number | null;
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

/** An audit entry with the actor's name filled in, for the screens */
export interface AuditEntryView extends AuditEntry {
  actorName: string | null;
}

/** Who is doing an admin action */
export interface AdminActor {
  id: number;
  name: string;
}

export type AdminRole = "super_admin" | "admin";

/** An organizer account, as stored (the sample store keeps a fake hash, never the password) */
export interface Admin {
  id: number;
  /** Lower-case */
  username: string;
  displayName: string;
  role: AdminRole;
  disabled: boolean;
  passwordHash: string;
  lastLoginAt: number | null;
  createdAt: number;
}

/** An organizer account as the screens see it: no password hash */
export type AdminAccount = Omit<Admin, "passwordHash">;

export interface NewAdminInput {
  username: string;
  displayName: string;
  role: AdminRole;
}

/** The deadlines super admins can change (architecture: the `settings` keys) */
export type DeadlineSettings = Pick<Deadlines, "registrationCloses" | "proposalDue" | "prototypeDue">;

/** What an edit changed, one entry per field, for the audit trail */
export interface FieldChange {
  /** e.g. `name`, `institutionName`, `member2.email` */
  field: string;
  from: string | null;
  to: string | null;
}

/** What the team edit form sends: the team's fixable details, members in position order */
export interface TeamEditInput {
  name: string;
  /** School and University teams: the one institution for every member */
  institutionName?: string;
  institutionIsOther?: boolean;
  /** Same number of members as the team has: edits can't add or remove people */
  members: {
    fullName: string;
    whatsapp: string;
    email: string;
    nic?: string;
    /** Open teams only */
    institutionType?: InstitutionType;
    institutionName?: string;
    institutionIsOther?: boolean;
  }[];
}

export type AuditActionGroup = "team" | "shortlist" | "finalists" | "admin" | "settings" | "export";

export interface AuditFilter {
  actorType?: ActorType;
  actorId?: number;
  actionGroup?: AuditActionGroup;
  /** Unix ms, inclusive */
  from?: number;
  /** Unix ms, inclusive */
  to?: number;
  offset?: number;
  /** Default 100 */
  limit?: number;
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
  | "no_prototype"
  | "rate_limited"
  | "confirmation_required"
  | "forbidden"
  | "invalid_credentials"
  | "duplicate_username"
  | "last_super_admin"
  | "own_account"
  | "not_found"
  /** An outside service (Drive, Sheets) isn't set up yet: its env variables are missing */
  | "not_configured"
  /** An outside service refused or failed; nothing was saved */
  | "upload_failed"
  /** The YouTube video doesn't exist or is private */
  | "video_unavailable"
  /** Someone else changed the record since it was loaded */
  | "edit_conflict";

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
  /** With `rate_limited`: how long until another try is allowed */
  retryAfterSeconds?: number;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: DataError };

// Calls

export interface CompetitionState {
  now: number;
  stage: Stage;
  shortlistState: ShortlistState;
  deadlines: Deadlines;
}

export interface ProposalUpload {
  /** The PDF. Sent to POST /api/team/proposal */
  file: File;
}

export interface UploadOptions {
  /** Called with 0 to 1 as the upload goes */
  onProgress?: (fraction: number) => void;
  /** Aborting rejects the call with an AbortError and leaves the previous version current */
  signal?: AbortSignal;
}
