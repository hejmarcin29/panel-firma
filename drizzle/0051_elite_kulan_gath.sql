CREATE TABLE `commissions` (
	`id` text PRIMARY KEY NOT NULL,
	`architect_id` text NOT NULL,
	`montage_id` text NOT NULL,
	`amount` integer NOT NULL,
	`rate` real NOT NULL,
	`area` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`approved_at` integer,
	`paid_at` integer,
	FOREIGN KEY (`architect_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `commissions_architect_id_idx` ON `commissions` (`architect_id`);--> statement-breakpoint
CREATE INDEX `commissions_montage_id_idx` ON `commissions` (`montage_id`);--> statement-breakpoint
CREATE INDEX `commissions_status_idx` ON `commissions` (`status`);--> statement-breakpoint
ALTER TABLE `customers` ADD `architect_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `montages` ADD `architect_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `montages_architect_id_idx` ON `montages` (`architect_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `architect_profile` text;