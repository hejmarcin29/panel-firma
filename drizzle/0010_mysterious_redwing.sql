CREATE TABLE `cooperation_rule_acks` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`acknowledged_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cooperation_rule_ack_user_version` ON `cooperation_rule_acks` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `cooperation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content_md` text NOT NULL,
	`version` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`requires_ack` integer DEFAULT true NOT NULL,
	`audience_json` text DEFAULT '["installer"]' NOT NULL,
	`effective_from` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cooperation_rules_active_version` ON `cooperation_rules` (`version`);