CREATE TABLE `order_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`label` text,
	`done` integer DEFAULT false NOT NULL,
	`done_at` integer,
	`done_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_checklist_order_id_idx` ON `order_checklist_items` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `order_checklist_order_key_unique` ON `order_checklist_items` (`order_id`,`key`);--> statement-breakpoint
ALTER TABLE `orders` ADD `pipeline_stage` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pipeline_stage_updated_at` integer;