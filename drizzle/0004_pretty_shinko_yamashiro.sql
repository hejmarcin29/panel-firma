CREATE TABLE `wfirma_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`token_type` text,
	`scope` text,
	`expires_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wfirma_tokens_tenant_idx` ON `wfirma_tokens` (`tenant`);--> statement-breakpoint
CREATE INDEX `wfirma_tokens_expires_at_idx` ON `wfirma_tokens` (`expires_at`);