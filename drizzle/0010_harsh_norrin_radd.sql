ALTER TABLE `montage_attachments` ADD `note_id` text REFERENCES montage_notes(id);--> statement-breakpoint
CREATE INDEX `montage_attachments_note_id_idx` ON `montage_attachments` (`note_id`);