CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`requires_measurement` integer DEFAULT false NOT NULL,
	`scheduled_date` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
