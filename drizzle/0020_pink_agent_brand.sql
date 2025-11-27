CREATE TABLE `google_calendar_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`access_token` text,
	`refresh_token` text,
	`expiry_date` integer,
	`target_calendar_id` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `montages` ADD `google_event_id` text;