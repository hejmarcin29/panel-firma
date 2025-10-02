ALTER TABLE `client_invites` ADD `client_id` text;--> statement-breakpoint
ALTER TABLE `client_invites` ADD `order_id` text;--> statement-breakpoint
ALTER TABLE `client_invites` ADD `allow_edit` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `client_invites_order_idx` ON `client_invites` (`order_id`);--> statement-breakpoint
CREATE INDEX `client_invites_client_idx` ON `client_invites` (`client_id`);