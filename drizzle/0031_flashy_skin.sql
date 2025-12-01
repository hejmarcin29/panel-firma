ALTER TABLE `montages` ADD `billing_postal_code` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `installation_postal_code` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `is_company` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `montages` ADD `company_name` text;--> statement-breakpoint
ALTER TABLE `montages` ADD `nip` text;