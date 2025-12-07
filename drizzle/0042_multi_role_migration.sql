ALTER TABLE `users` ADD `roles` text DEFAULT '["installer"]' NOT NULL;
UPDATE `users` SET `roles` = '["admin"]' WHERE `role` = 'admin';
UPDATE `users` SET `roles` = '["measurer"]' WHERE `role` = 'measurer';
UPDATE `users` SET `roles` = '["installer"]' WHERE `role` = 'installer';
ALTER TABLE `users` DROP COLUMN `role`;
