CREATE TABLE `partner_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`changed_by_id` text,
	`from_status` text,
	`to_status` text NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `partner_status_history_partner_idx` ON `partner_status_history` (`partner_id`);--> statement-breakpoint
CREATE INDEX `partner_status_history_changed_idx` ON `partner_status_history` (`changed_by_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_partners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`company_name` text NOT NULL,
	`segment` text,
	`region` text,
	`status` text DEFAULT 'ROZWOJOWY' NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`tax_id` text,
	`phone` text,
	`email` text,
	`notes` text,
	`archived_at` integer,
	`archived_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_partners`(
"id",
"user_id",
"company_name",
"segment",
"region",
"status",
"contact_name",
"contact_email",
"contact_phone",
"tax_id",
"phone",
"email",
"notes",
"archived_at",
"archived_reason",
"created_at",
"updated_at"
)
SELECT
	"id",
	"user_id",
	"company_name",
	NULL,
	NULL,
	'ROZWOJOWY',
	"contact_name",
	"email",
	"phone",
	"tax_id",
	"phone",
	"email",
	"notes",
	NULL,
	NULL,
	"created_at",
	"updated_at"
FROM `partners`;--> statement-breakpoint
DROP TABLE `partners`;--> statement-breakpoint
ALTER TABLE `__new_partners` RENAME TO `partners`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `partners_user_id_unique` ON `partners` (`user_id`);--> statement-breakpoint
CREATE INDEX `partners_status_idx` ON `partners` (`status`);--> statement-breakpoint
CREATE INDEX `partners_region_idx` ON `partners` (`region`);--> statement-breakpoint
CREATE INDEX `partners_archived_idx` ON `partners` (`archived_at`);