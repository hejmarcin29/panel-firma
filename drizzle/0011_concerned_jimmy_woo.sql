CREATE TABLE `installer_google_prefs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`calendar_id` text,
	`time_zone` text DEFAULT 'Europe/Warsaw' NOT NULL,
	`default_reminder_minutes` integer DEFAULT 60 NOT NULL,
	`auto_sync` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_google_events` (
	`order_id` text PRIMARY KEY NOT NULL,
	`installer_id` text NOT NULL,
	`calendar_id` text NOT NULL,
	`google_event_id` text NOT NULL,
	`last_synced_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
