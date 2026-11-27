CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT "admins_role_check" CHECK("role" IN ('super_admin', 'admin'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` integer,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`details` text,
	`ip` text,
	`created_at` integer NOT NULL,
	CONSTRAINT "audit_log_actor_type_check" CHECK("actor_type" IN ('team', 'admin', 'system', 'anonymous'))
);
--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_target_idx` ON `audit_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer,
	`to_email` text NOT NULL,
	`template` text NOT NULL,
	`props` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "email_outbox_template_check" CHECK("template" IN ('registration_confirmed', 'code_reminder', 'proposal_received', 'shortlisted', 'prototype_received', 'finalist')),
	CONSTRAINT "email_outbox_status_check" CHECK("status" IN ('pending', 'sent', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `email_outbox_due_idx` ON `email_outbox` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`position` integer NOT NULL,
	`full_name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text NOT NULL,
	`institution_type` text NOT NULL,
	`institution_name` text NOT NULL,
	`institution_is_other` integer DEFAULT false NOT NULL,
	`nic` text,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "members_position_check" CHECK("members"."position" BETWEEN 1 AND 5),
	CONSTRAINT "members_institution_type_check" CHECK("institution_type" IN ('school', 'university'))
);
--> statement-breakpoint
CREATE INDEX `members_team_idx` ON `members` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_nic_unique` ON `members` (`nic`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_team_position_unique` ON `members` (`team_id`,`position`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	CONSTRAINT "sessions_subject_type_check" CHECK("subject_type" IN ('team', 'admin'))
);
--> statement-breakpoint
CREATE INDEX `sessions_subject_idx` ON `sessions` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shortlist_finalisations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`finalised_by` integer NOT NULL,
	`finalised_at` integer NOT NULL,
	`shortlisted_count` integer NOT NULL,
	`newly_emailed_count` integer NOT NULL,
	`team_ids` text NOT NULL,
	FOREIGN KEY (`finalised_by`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`kind` text NOT NULL,
	`version` integer NOT NULL,
	`is_current` integer NOT NULL,
	`drive_file_id` text,
	`drive_url` text,
	`file_name` text,
	`size_bytes` integer,
	`sha256` text,
	`youtube_id` text,
	`youtube_url` text,
	`submitted_at` integer NOT NULL,
	`submitted_ip` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "submissions_kind_check" CHECK("kind" IN ('proposal', 'prototype'))
);
--> statement-breakpoint
CREATE INDEX `submissions_current_idx` ON `submissions` (`team_id`,`kind`,`is_current`);--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_version_unique` ON `submissions` (`team_id`,`kind`,`version`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`institution_name` text,
	`institution_is_other` integer DEFAULT false NOT NULL,
	`stage` text DEFAULT 'registered' NOT NULL,
	`shortlist_mark` integer DEFAULT false NOT NULL,
	`shortlist_emailed_at` integer,
	`finalist_emailed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "teams_category_check" CHECK("category" IN ('school', 'university', 'open')),
	CONSTRAINT "teams_stage_check" CHECK("stage" IN ('registered', 'proposal_submitted', 'shortlisted', 'not_shortlisted', 'prototype_submitted', 'finalist'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_code_unique` ON `teams` (`code`);--> statement-breakpoint
CREATE INDEX `teams_category_idx` ON `teams` (`category`);--> statement-breakpoint
CREATE INDEX `teams_stage_idx` ON `teams` (`stage`);