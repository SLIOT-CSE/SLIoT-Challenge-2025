import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { SUBMISSION_KINDS, TEAM_STAGES } from "@/lib/team-rules";

// The nine tables from docs/architecture.md, section 5. Change this file, then run
// `pnpm db:generate` to write a migration and `pnpm db:migrate` to apply it.
//
// Conventions: times are UTC Unix milliseconds (INTEGER), booleans INTEGER 0/1, enums TEXT
// with a CHECK so bad values can't get in from outside the app either.

export const CATEGORIES = ["school", "university", "open"] as const;
export const INSTITUTION_TYPES = ["school", "university"] as const;
export const ADMIN_ROLES = ["super_admin", "admin"] as const;
export const SESSION_SUBJECTS = ["team", "admin"] as const;
export const EMAIL_TEMPLATES = [
  "registration_confirmed",
  "code_reminder",
  "proposal_received",
  "shortlisted",
  "prototype_received",
  "prototype_reminder",
  "semifinalist",
  "finalist",
] as const;
export const EMAIL_STATUSES = ["pending", "sent", "failed"] as const;
export const ACTOR_TYPES = ["team", "admin", "system", "anonymous"] as const;

/** `column IN ('a', 'b')` for a CHECK constraint */
function oneOf(column: string, values: readonly string[]) {
  return sql.raw(`"${column}" IN (${values.map((value) => `'${value}'`).join(", ")})`);
}

const createdAt = () => integer("created_at").notNull();

export const teams = sqliteTable(
  "teams",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category", { enum: CATEGORIES }).notNull(),
    /** Empty for Open teams, where each member names their own */
    institutionName: text("institution_name"),
    institutionIsOther: integer("institution_is_other", { mode: "boolean" }).notNull().default(false),
    stage: text("stage", { enum: TEAM_STAGES }).notNull().default("registered"),
    /** Draft tick by a super admin. Hidden from teams and admins until finalised */
    shortlistMark: integer("shortlist_mark", { mode: "boolean" }).notNull().default(false),
    shortlistEmailedAt: integer("shortlist_emailed_at"),
    finalistEmailedAt: integer("finalist_emailed_at"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("teams_code_unique").on(table.code),
    index("teams_category_idx").on(table.category),
    index("teams_stage_idx").on(table.stage),
    check("teams_category_check", oneOf("category", CATEGORIES)),
    check("teams_stage_check", oneOf("stage", TEAM_STAGES)),
  ],
);

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    /** 1 to 5. 1 is the team leader, who receives every team email */
    position: integer("position").notNull(),
    fullName: text("full_name").notNull(),
    /** Stored as +947XXXXXXXX */
    whatsapp: text("whatsapp").notNull(),
    /** Lower-case. Unique across all teams: one team per person */
    email: text("email").notNull(),
    institutionType: text("institution_type", { enum: INSTITUTION_TYPES }).notNull(),
    institutionName: text("institution_name").notNull(),
    institutionIsOther: integer("institution_is_other", { mode: "boolean" }).notNull().default(false),
    /** University students only. Upper-case. Unique across all teams (NULLs don't clash) */
    nic: text("nic"),
  },
  (table) => [
    index("members_team_idx").on(table.teamId),
    uniqueIndex("members_email_unique").on(table.email),
    uniqueIndex("members_nic_unique").on(table.nic),
    uniqueIndex("members_team_position_unique").on(table.teamId, table.position),
    check("members_position_check", sql`${table.position} BETWEEN 1 AND 5`),
    check("members_institution_type_check", oneOf("institution_type", INSTITUTION_TYPES)),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: SUBMISSION_KINDS }).notNull(),
    /** 1, 2, 3 ... per team and kind */
    version: integer("version").notNull(),
    /** The newest of each kind. Older versions are kept */
    isCurrent: integer("is_current", { mode: "boolean" }).notNull(),
    // proposals
    driveFileId: text("drive_file_id"),
    driveUrl: text("drive_url"),
    fileName: text("file_name"),
    sizeBytes: integer("size_bytes"),
    sha256: text("sha256"),
    // prototypes
    youtubeId: text("youtube_id"),
    youtubeUrl: text("youtube_url"),
    submittedAt: integer("submitted_at").notNull(),
    submittedIp: text("submitted_ip").notNull(),
  },
  (table) => [
    index("submissions_current_idx").on(table.teamId, table.kind, table.isCurrent),
    uniqueIndex("submissions_version_unique").on(table.teamId, table.kind, table.version),
    check("submissions_kind_check", oneOf("kind", SUBMISSION_KINDS)),
  ],
);

export const admins = sqliteTable(
  "admins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Lower-case */
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    /** argon2id */
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ADMIN_ROLES }).notNull(),
    disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
    lastLoginAt: integer("last_login_at"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("admins_username_unique").on(table.username),
    check("admins_role_check", oneOf("role", ADMIN_ROLES)),
  ],
);

/** One logged-in browser. `subject_id` points at teams or admins, checked by the app */
export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the random token. The raw token exists only in the cookie */
    id: text("id").primaryKey(),
    subjectType: text("subject_type", { enum: SESSION_SUBJECTS }).notNull(),
    subjectId: integer("subject_id").notNull(),
    createdAt: createdAt(),
    expiresAt: integer("expires_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("sessions_subject_idx").on(table.subjectType, table.subjectId),
    index("sessions_expires_idx").on(table.expiresAt),
    check("sessions_subject_type_check", oneOf("subject_type", SESSION_SUBJECTS)),
  ],
);

/** Key–value settings. `value` is JSON */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: integer("updated_at").notNull(),
});

/** One press of "Finalise shortlist", so every version of the shortlist is on record */
export const shortlistFinalisations = sqliteTable("shortlist_finalisations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  finalisedBy: integer("finalised_by")
    .notNull()
    .references(() => admins.id),
  finalisedAt: integer("finalised_at").notNull(),
  shortlistedCount: integer("shortlisted_count").notNull(),
  newlyEmailedCount: integer("newly_emailed_count").notNull(),
  /** JSON list of the shortlisted team ids */
  teamIds: text("team_ids", { mode: "json" }).$type<number[]>().notNull(),
});

export const emailOutbox = sqliteTable(
  "email_outbox",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
    toEmail: text("to_email").notNull(),
    template: text("template", { enum: EMAIL_TEMPLATES }).notNull(),
    /** JSON props for the template, rendered at send time */
    props: text("props", { mode: "json" }).$type<Record<string, string>>().notNull(),
    status: text("status", { enum: EMAIL_STATUSES }).notNull().default("pending"),
    /** Gives up after 6 */
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: integer("next_attempt_at").notNull(),
    lastError: text("last_error"),
    createdAt: createdAt(),
    sentAt: integer("sent_at"),
  },
  (table) => [
    index("email_outbox_due_idx").on(table.status, table.nextAttemptAt),
    check("email_outbox_template_check", oneOf("template", EMAIL_TEMPLATES)),
    check("email_outbox_status_check", oneOf("status", EMAIL_STATUSES)),
  ],
);

/** Rows are only added, never edited. `actor_id` points at teams or admins, checked by the app */
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorType: text("actor_type", { enum: ACTOR_TYPES }).notNull(),
    actorId: integer("actor_id"),
    /** e.g. team.registered, proposal.uploaded, shortlist.finalised */
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    /** JSON: what changed */
    details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_log_created_idx").on(table.createdAt),
    index("audit_log_target_idx").on(table.targetType, table.targetId),
    check("audit_log_actor_type_check", oneOf("actor_type", ACTOR_TYPES)),
  ],
);
