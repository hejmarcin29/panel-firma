ALTER TABLE `montages` ADD `architect_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;
CREATE INDEX `montages_architect_id_idx` ON `montages` (`architect_id`);
