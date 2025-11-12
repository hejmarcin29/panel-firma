CREATE TABLE `mail_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`provider` text,
	`status` text DEFAULT 'disabled' NOT NULL,
	`last_sync_at` integer,
	`next_sync_at` integer,
	`imap_host` text,
	`imap_port` integer,
	`imap_secure` integer DEFAULT true NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_secure` integer DEFAULT true NOT NULL,
	`username` text NOT NULL,
	`password_secret` text,
	`signature` text,
	`error` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mail_accounts_email_idx` ON `mail_accounts` (`email`);--> statement-breakpoint
CREATE INDEX `mail_accounts_status_idx` ON `mail_accounts` (`status`);--> statement-breakpoint
CREATE TABLE `mail_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'custom' NOT NULL,
	`remote_id` text,
	`path` text,
	`sort_order` integer DEFAULT 0,
	`unread_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `mail_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mail_folders_account_id_idx` ON `mail_folders` (`account_id`);--> statement-breakpoint
CREATE INDEX `mail_folders_remote_id_idx` ON `mail_folders` (`account_id`,`remote_id`);--> statement-breakpoint
CREATE INDEX `mail_folders_kind_idx` ON `mail_folders` (`kind`);--> statement-breakpoint
CREATE TABLE `mail_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`subject` text,
	`from_address` text,
	`from_name` text,
	`to_recipients` text,
	`cc_recipients` text,
	`bcc_recipients` text,
	`reply_to` text,
	`snippet` text,
	`text_body` text,
	`html_body` text,
	`message_id` text,
	`thread_id` text,
	`external_id` text,
	`received_at` integer,
	`internal_date` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`is_starred` integer DEFAULT false NOT NULL,
	`has_attachments` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `mail_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `mail_folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mail_messages_account_id_idx` ON `mail_messages` (`account_id`);--> statement-breakpoint
CREATE INDEX `mail_messages_folder_id_idx` ON `mail_messages` (`folder_id`);--> statement-breakpoint
CREATE INDEX `mail_messages_received_at_idx` ON `mail_messages` (`received_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `mail_messages_message_id_idx` ON `mail_messages` (`account_id`,`message_id`);