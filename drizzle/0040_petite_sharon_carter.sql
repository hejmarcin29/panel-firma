PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`dashboard_config` text,
	`mobile_menu_config` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password_hash", "name", "role", "is_active", "dashboard_config", "mobile_menu_config", "created_at", "updated_at") SELECT "id", "email", "password_hash", "name", "role", "is_active", "dashboard_config", "mobile_menu_config", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `montages` ADD `installer_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `montages` ADD `measurer_id` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `montages_installer_id_idx` ON `montages` (`installer_id`);--> statement-breakpoint
CREATE INDEX `montages_measurer_id_idx` ON `montages` (`measurer_id`);