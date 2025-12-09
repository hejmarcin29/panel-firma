ALTER TABLE `montages` ADD `technical_audit` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `material_log` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `original_user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `installer_profile` text;