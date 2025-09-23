CREATE TABLE `client_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`content` text NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`invoice_city` text,
	`invoice_address` text,
	`delivery_city` text,
	`delivery_address` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
