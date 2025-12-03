ALTER TABLE `montages` ADD `panel_model` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `panel_waste` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `skirting_model` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `skirting_waste` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `models_approved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `montages` ADD `final_panel_amount` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `final_skirting_length` integer;--> statement-breakpoint
ALTER TABLE `montages` ADD `materials_edit_history` text;--> statement-breakpoint
ALTER TABLE `montages` DROP COLUMN `panel_type`;