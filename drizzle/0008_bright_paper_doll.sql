CREATE TABLE `montage_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`montage_id` text NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `montage_attachments_montage_id_idx` ON `montage_attachments` (`montage_id`);--> statement-breakpoint
CREATE INDEX `montage_attachments_created_at_idx` ON `montage_attachments` (`created_at`);--> statement-breakpoint
CREATE TABLE `montages` (
	`id` text PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`contact_phone` text,
	`contact_email` text,
	`address` text,
	`status` text DEFAULT 'lead' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
CREATE INDEX `montages_status_idx` ON `montages` (`status`);
CREATE INDEX `montages_updated_at_idx` ON `montages` (`updated_at`);
CREATE TABLE `montage_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`montage_id` text NOT NULL,
	`content` text NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `montage_notes_montage_id_idx` ON `montage_notes` (`montage_id`);
CREATE INDEX `montage_notes_created_at_idx` ON `montage_notes` (`created_at`);
CREATE TABLE `montage_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`montage_id` text NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `montage_attachments_montage_id_idx` ON `montage_attachments` (`montage_id`);
CREATE INDEX `montage_attachments_created_at_idx` ON `montage_attachments` (`created_at`);
CREATE TABLE `montage_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`montage_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`order_index` integer,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `montage_tasks_montage_id_idx` ON `montage_tasks` (`montage_id`);
CREATE INDEX `montage_tasks_completed_idx` ON `montage_tasks` (`completed`);