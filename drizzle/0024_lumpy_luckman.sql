ALTER TABLE `montages` ADD `display_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `montages_display_id_idx` ON `montages` (`display_id`);