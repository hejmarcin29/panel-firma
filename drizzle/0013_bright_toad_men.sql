CREATE TABLE `delivery_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`planned_at` integer,
	`window_start` integer,
	`window_end` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`carrier` text,
	`tracking_no` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_slots_order_id_idx` ON `delivery_slots` (`order_id`);--> statement-breakpoint
CREATE INDEX `delivery_slots_status_planned_idx` ON `delivery_slots` (`status`,`planned_at`);--> statement-breakpoint
CREATE TABLE `installation_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`planned_at` integer,
	`window_start` integer,
	`window_end` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`installer_id` text,
	`duration_minutes` integer,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `installation_slots_order_id_idx` ON `installation_slots` (`order_id`);--> statement-breakpoint
CREATE INDEX `installation_slots_installer_planned_idx` ON `installation_slots` (`installer_id`,`planned_at`);--> statement-breakpoint
CREATE INDEX `installation_slots_status_planned_idx` ON `installation_slots` (`status`,`planned_at`);