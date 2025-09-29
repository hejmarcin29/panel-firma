CREATE TABLE `delivery_items` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`name` text NOT NULL,
	`sqm_centi` integer,
	`packs` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_items_slot_idx` ON `delivery_items` (`slot_id`);