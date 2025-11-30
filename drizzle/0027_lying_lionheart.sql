CREATE TABLE `board_columns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `board_columns_order_idx` ON `board_columns` (`order_index`);--> statement-breakpoint
CREATE TABLE `board_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`column_id` text NOT NULL,
	`content` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`column_id`) REFERENCES `board_columns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `board_tasks_column_id_idx` ON `board_tasks` (`column_id`);--> statement-breakpoint
CREATE INDEX `board_tasks_order_idx` ON `board_tasks` (`order_index`);