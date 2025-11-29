ALTER TABLE `montage_attachments` ADD `task_id` text REFERENCES `montage_tasks`(`id`) ON DELETE SET NULL;
CREATE INDEX `montage_attachments_task_id_idx` ON `montage_attachments` (`task_id`);
