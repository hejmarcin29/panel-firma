CREATE TABLE `order_note_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`content` text NOT NULL,
	`edited_by` text,
	`edited_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `installer_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pre_measurement_sqm` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `internal_note` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `internal_note_updated_at` integer;