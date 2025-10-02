CREATE TABLE `client_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`purpose` text DEFAULT 'new_client' NOT NULL,
	`allowed_fields_json` text DEFAULT '["name","phone","email","source"]' NOT NULL,
	`expires_at` integer,
	`used_at` integer,
	`result_client_id` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_invites_token_unique` ON `client_invites` (`token`);--> statement-breakpoint
CREATE INDEX `client_invites_expires_idx` ON `client_invites` (`expires_at`);--> statement-breakpoint
CREATE INDEX `client_invites_used_idx` ON `client_invites` (`used_at`);