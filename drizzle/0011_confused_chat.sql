CREATE TABLE `montage_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`montage_id` text NOT NULL,
	`template_id` text NOT NULL,
	`label` text NOT NULL,
	`allow_attachment` integer DEFAULT false NOT NULL,
	`attachment_id` text,
	`completed` integer DEFAULT false NOT NULL,
	`order_index` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`montage_id`) REFERENCES `montages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attachment_id`) REFERENCES `montage_attachments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `montage_checklist_items_montage_id_idx` ON `montage_checklist_items` (`montage_id`);--> statement-breakpoint
CREATE INDEX `montage_checklist_items_completed_idx` ON `montage_checklist_items` (`completed`);--> statement-breakpoint
ALTER TABLE `montages` ADD `material_details` text;