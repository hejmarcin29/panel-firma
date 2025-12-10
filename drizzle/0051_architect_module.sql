ALTER TABLE `users` ADD `architect_profile` text;
ALTER TABLE `customers` ADD `architect_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;
CREATE TABLE `commissions` (
	`id` text PRIMARY KEY NOT NULL,
	`architect_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`montage_id` text NOT NULL REFERENCES `montages`(`id`) ON DELETE CASCADE,
	`amount` integer NOT NULL,
	`rate` real NOT NULL,
	`area` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`approved_at` integer,
	`paid_at` integer
);
CREATE INDEX `commissions_architect_id_idx` ON `commissions` (`architect_id`);
CREATE INDEX `commissions_montage_id_idx` ON `commissions` (`montage_id`);
CREATE INDEX `commissions_status_idx` ON `commissions` (`status`);
