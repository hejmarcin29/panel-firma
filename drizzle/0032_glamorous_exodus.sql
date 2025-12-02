CREATE TABLE `task_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`file_url` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `board_tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_attachments_task_id_idx` ON `task_attachments` (`task_id`);--> statement-breakpoint
ALTER TABLE `board_tasks` ADD `due_date` integer;--> statement-breakpoint
ALTER TABLE `board_tasks` ADD `reminder_at` integer;