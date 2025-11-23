ALTER TABLE `manual_orders` ADD `type` text DEFAULT 'production' NOT NULL;--> statement-breakpoint
CREATE INDEX `manual_orders_type_idx` ON `manual_orders` (`type`);