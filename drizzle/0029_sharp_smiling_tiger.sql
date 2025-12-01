ALTER TABLE `board_tasks` ADD `description` text;--> statement-breakpoint
ALTER TABLE `board_tasks` ADD `completed` integer DEFAULT false NOT NULL;