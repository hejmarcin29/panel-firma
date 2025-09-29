CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`order_id` text,
	`mime` text,
	`size` integer,
	`sha256` text,
	`key` text NOT NULL,
	`public_url` text NOT NULL,
	`title` text,
	`correspondent` text,
	`issue_date` integer,
	`direction` text,
	`source` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE INDEX `documents_client_idx` ON `documents` (`client_id`);--> statement-breakpoint
CREATE INDEX `documents_order_idx` ON `documents` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `documents_sha256_unique` ON `documents` (`sha256`);