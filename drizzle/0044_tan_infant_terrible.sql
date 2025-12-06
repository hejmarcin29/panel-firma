CREATE TABLE `products` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text,
	`price` text,
	`regular_price` text,
	`sale_price` text,
	`status` text NOT NULL,
	`stock_status` text,
	`stock_quantity` integer,
	`image_url` text,
	`categories` text,
	`attributes` text,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`synced_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
