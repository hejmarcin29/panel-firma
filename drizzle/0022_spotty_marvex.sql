DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `clients` ADD `prefer_vat_invoice` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `buyer_type` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `invoice_email` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `e_invoice_consent` integer DEFAULT false NOT NULL;