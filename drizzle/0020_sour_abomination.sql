CREATE TABLE `order_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text,
	`version` integer DEFAULT 1 NOT NULL,
	`mime` text,
	`size` integer,
	`key` text NOT NULL,
	`public_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_attachments_order_id_idx` ON `order_attachments` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_attachments_order_category_idx` ON `order_attachments` (`order_id`,`category`);