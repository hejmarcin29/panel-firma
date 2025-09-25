CREATE UNIQUE INDEX `clients_client_no_unique` ON `clients` (`client_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_no_unique` ON `orders` (`order_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_client_seq_unique` ON `orders` (`client_id`,`seq`);