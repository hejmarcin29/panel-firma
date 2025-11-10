CREATE TABLE `manual_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`vat_rate` integer NOT NULL,
	`unit_price_per_square_meter` integer,
	`total_net` integer NOT NULL,
	`total_gross` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `manual_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `manual_order_items_order_id_idx` ON `manual_order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `manual_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`status` text NOT NULL,
	`channel` text NOT NULL,
	`notes` text,
	`currency` text DEFAULT 'PLN' NOT NULL,
	`total_net` integer NOT NULL,
	`total_gross` integer NOT NULL,
	`billing_name` text NOT NULL,
	`billing_street` text NOT NULL,
	`billing_postal_code` text NOT NULL,
	`billing_city` text NOT NULL,
	`billing_phone` text NOT NULL,
	`billing_email` text NOT NULL,
	`shipping_same_as_billing` integer DEFAULT false NOT NULL,
	`shipping_name` text,
	`shipping_street` text,
	`shipping_postal_code` text,
	`shipping_city` text,
	`shipping_phone` text,
	`shipping_email` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manual_orders_reference_idx` ON `manual_orders` (`reference`);--> statement-breakpoint
CREATE INDEX `manual_orders_created_at_idx` ON `manual_orders` (`created_at`);