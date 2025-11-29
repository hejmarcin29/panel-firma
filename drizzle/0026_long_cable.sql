ALTER TABLE `montage_attachments` ADD `task_id` text REFERENCES montage_tasks(id);--> statement-breakpoint
ALTER TABLE `montages` ADD `floor_area` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `floor_details` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `skirting_length` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `skirting_details` text;