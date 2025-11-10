CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`tax_id` text,
	`billing_street` text,
	`billing_city` text,
	`billing_postal_code` text,
	`billing_country` text,
	`shipping_street` text,
	`shipping_city` text,
	`shipping_postal_code` text,
	`shipping_country` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_tax_id_idx` ON `customers` (`tax_id`);--> statement-breakpoint
CREATE TABLE `document_events` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`status` text NOT NULL,
	`actor_id` text,
	`note` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `document_events_document_id_idx` ON `document_events` (`document_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`wfirma_id` integer,
	`number` text,
	`issue_date` integer,
	`pdf_url` text,
	`gross_amount` integer,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `documents_type_idx` ON `documents` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `documents_wfirma_id_idx` ON `documents` (`wfirma_id`);--> statement-breakpoint
CREATE INDEX `documents_status_idx` ON `documents` (`status`);--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`integration` text NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`meta` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`channel` text NOT NULL,
	`template_code` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` integer,
	`provider_message_id` text,
	`error` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notifications_order_id_idx` ON `notifications` (`order_id`);--> statement-breakpoint
CREATE INDEX `notifications_template_code_idx` ON `notifications` (`template_code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`sku` text,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_order_id` text,
	`status` text NOT NULL,
	`customer_id` text,
	`total_net` integer NOT NULL,
	`total_gross` integer NOT NULL,
	`currency` text NOT NULL,
	`expected_ship_date` integer,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_source_idx` ON `orders` (`source`,`source_order_id`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `payment_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`confidence_score` integer,
	`matched_by` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`payment_date` integer,
	`bank_operation_id` text,
	`raw_reference` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_bank_operation_id_unique` ON `payments` (`bank_operation_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payments_payment_date_idx` ON `payments` (`payment_date`);--> statement-breakpoint
CREATE TABLE `supplier_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_request_id` text NOT NULL,
	`direction` text NOT NULL,
	`medium` text NOT NULL,
	`subject` text,
	`body` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`supplier_request_id`) REFERENCES `supplier_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `supplier_messages_request_idx` ON `supplier_messages` (`supplier_request_id`);--> statement-breakpoint
CREATE TABLE `supplier_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` integer,
	`response_received_at` integer,
	`carrier` text,
	`tracking_number` text,
	`payload` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `supplier_requests_status_idx` ON `supplier_requests` (`status`);