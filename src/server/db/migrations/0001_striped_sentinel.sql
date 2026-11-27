PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_outbox` (
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
	CONSTRAINT "email_outbox_template_check" CHECK("template" IN ('registration_confirmed', 'code_reminder', 'proposal_received', 'shortlisted', 'prototype_received', 'prototype_reminder', 'semifinalist', 'finalist')),
	CONSTRAINT "email_outbox_status_check" CHECK("status" IN ('pending', 'sent', 'failed'))
);
--> statement-breakpoint
INSERT INTO `__new_email_outbox`("id", "team_id", "to_email", "template", "props", "status", "attempts", "next_attempt_at", "last_error", "created_at", "sent_at") SELECT "id", "team_id", "to_email", "template", "props", "status", "attempts", "next_attempt_at", "last_error", "created_at", "sent_at" FROM `email_outbox`;--> statement-breakpoint
DROP TABLE `email_outbox`;--> statement-breakpoint
ALTER TABLE `__new_email_outbox` RENAME TO `email_outbox`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `email_outbox_due_idx` ON `email_outbox` (`status`,`next_attempt_at`);