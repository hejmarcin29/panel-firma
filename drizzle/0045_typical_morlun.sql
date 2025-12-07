ALTER TABLE `montages` ADD `google_event_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `roles` text DEFAULT '["admin"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;