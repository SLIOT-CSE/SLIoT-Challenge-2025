PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`position` integer NOT NULL,
	`full_name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text NOT NULL,
	`institution_type` text NOT NULL,
	`institution_name` text,
	`institution_is_other` integer DEFAULT false NOT NULL,
	`nic` text,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "members_position_check" CHECK("__new_members"."position" BETWEEN 1 AND 5),
	CONSTRAINT "members_institution_type_check" CHECK("institution_type" IN ('school', 'university', 'independent'))
);
--> statement-breakpoint
INSERT INTO `__new_members`("id", "team_id", "position", "full_name", "whatsapp", "email", "institution_type", "institution_name", "institution_is_other", "nic") SELECT "id", "team_id", "position", "full_name", "whatsapp", "email", "institution_type", "institution_name", "institution_is_other", "nic" FROM `members`;--> statement-breakpoint
DROP TABLE `members`;--> statement-breakpoint
ALTER TABLE `__new_members` RENAME TO `members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `members_team_idx` ON `members` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_nic_unique` ON `members` (`nic`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_team_position_unique` ON `members` (`team_id`,`position`);