ALTER TABLE `montages` ADD `measurement_installation_method` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `measurement_subfloor_condition` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `measurement_additional_work_needed` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `montages` ADD `measurement_additional_work_description` text;