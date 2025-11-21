CREATE TABLE `order_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `manual_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_attachments_order_id_idx` ON `order_attachments` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_attachments_created_at_idx` ON `order_attachments` (`created_at`);