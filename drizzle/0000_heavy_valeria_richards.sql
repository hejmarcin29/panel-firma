CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text,
	`full_name` text NOT NULL,
	`invoice_name` text,
	`invoice_tax_id` text,
	`invoice_street` text,
	`invoice_city` text,
	`invoice_postal_code` text,
	`phone` text,
	`email` text,
	`postal_code` text,
	`city` text,
	`street` text,
	`acquisition_source` text,
	`additional_info` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `clients_partner_idx` ON `clients` (`partner_id`);--> statement-breakpoint
CREATE INDEX `clients_email_idx` ON `clients` (`email`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`installation_id` text,
	`client_id` text NOT NULL,
	`scheduled_date` integer,
	`stage` text NOT NULL,
	`include_panels` integer DEFAULT false NOT NULL,
	`panel_style` text,
	`panel_product_id` text,
	`include_baseboards` integer DEFAULT false NOT NULL,
	`baseboard_product_id` text,
	`shipping_address_street` text,
	`shipping_address_city` text,
	`shipping_address_postal_code` text,
	`notes` text,
	`proforma_issued` integer DEFAULT false NOT NULL,
	`deposit_final_invoice_issued` integer DEFAULT false NOT NULL,
	`shipping_ordered` integer DEFAULT false NOT NULL,
	`review_received` integer DEFAULT false NOT NULL,
	`requires_admin_attention` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `installations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`panel_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`baseboard_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `deliveries_client_idx` ON `deliveries` (`client_id`);--> statement-breakpoint
CREATE INDEX `deliveries_installation_idx` ON `deliveries` (`installation_id`);--> statement-breakpoint
CREATE INDEX `deliveries_stage_idx` ON `deliveries` (`stage`);--> statement-breakpoint
CREATE TABLE `delivery_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`delivery_id` text NOT NULL,
	`changed_by_id` text,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text,
	`file_size` integer,
	`uploaded_by_id` text,
	`installation_id` text,
	`delivery_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`installation_id`) REFERENCES `installations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_key_unique` ON `files` (`key`);--> statement-breakpoint
CREATE INDEX `files_installation_idx` ON `files` (`installation_id`);--> statement-breakpoint
CREATE TABLE `installation_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`installation_id` text NOT NULL,
	`changed_by_id` text,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `installations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `installations` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`partner_id` text,
	`created_by_id` text,
	`assigned_installer_id` text,
	`type` text NOT NULL,
	`stage` text NOT NULL,
	`stage_notes` text,
	`declared_floor_area` real,
	`building_type` text,
	`panel_style` text,
	`panel_product_id` text,
	`baseboard_linear_meters` real,
	`baseboard_product_id` text,
	`address_same_as_invoice` integer DEFAULT true NOT NULL,
	`address_street` text,
	`address_city` text,
	`address_postal_code` text,
	`location_pin_url` text,
	`scheduled_at` integer,
	`additional_work` text,
	`additional_info` text,
	`customer_notes` text,
	`installation_confirmed` integer DEFAULT false NOT NULL,
	`deposit_invoice_issued` integer DEFAULT false NOT NULL,
	`final_invoice_issued` integer DEFAULT false NOT NULL,
	`quote_sent` integer DEFAULT false NOT NULL,
	`measurement_completed` integer DEFAULT false NOT NULL,
	`handover_protocol_signed` integer DEFAULT false NOT NULL,
	`review_received` integer DEFAULT false NOT NULL,
	`requires_admin_attention` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_installer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`panel_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`baseboard_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `installations_client_idx` ON `installations` (`client_id`);--> statement-breakpoint
CREATE INDEX `installations_stage_idx` ON `installations` (`stage`);--> statement-breakpoint
CREATE INDEX `installations_assigned_idx` ON `installations` (`assigned_installer_id`);--> statement-breakpoint
CREATE TABLE `installers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text,
	`region` text,
	`bio` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `installers_user_id_unique` ON `installers` (`user_id`);--> statement-breakpoint
CREATE TABLE `measurement_notes_history` (
	`id` text PRIMARY KEY NOT NULL,
	`measurement_id` text NOT NULL,
	`changed_by_id` text,
	`previous_note` text,
	`next_note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`measurement_id`) REFERENCES `measurements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`installation_id` text NOT NULL,
	`measured_by_id` text NOT NULL,
	`measured_floor_area` real,
	`measured_baseboard_length` real,
	`customer_info_note` text,
	`panel_adjustment` text,
	`offcut_percent` real,
	`panel_product_id` text,
	`delivery_timing_type` text NOT NULL,
	`delivery_days_before` integer,
	`delivery_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `installations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`measured_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`panel_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `measurements_installation_idx` ON `measurements` (`installation_id`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`company_name` text,
	`contact_name` text,
	`tax_id` text,
	`phone` text,
	`email` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_user_id_unique` ON `partners` (`user_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`type` text NOT NULL,
	`style` text,
	`brand` text,
	`color` text,
	`length_mm` integer,
	`width_mm` integer,
	`thickness_mm` integer,
	`unit_price` real,
	`metadata` blob,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_type_idx` ON `products` (`type`);--> statement-breakpoint
CREATE INDEX `products_sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`due_date` integer,
	`assigned_to_id` text,
	`related_installation_id` text,
	`related_delivery_id` text,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`related_installation_id`) REFERENCES `installations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`related_delivery_id`) REFERENCES `deliveries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`name` text,
	`phone` text,
	`avatar_url` text,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);