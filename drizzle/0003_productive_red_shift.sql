ALTER TABLE `manual_orders` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `manual_orders` ADD `source_order_id` text;--> statement-breakpoint
ALTER TABLE `manual_orders` ADD `requires_review` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `manual_orders_requires_review_idx` ON `manual_orders` (`requires_review`);