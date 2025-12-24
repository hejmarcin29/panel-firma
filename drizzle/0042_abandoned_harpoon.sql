ALTER TABLE "erp_products" ADD COLUMN "price" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "regular_price" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "sale_price" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "stock_quantity" integer;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "source" text DEFAULT 'local';--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "is_sync_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "woo_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "woo_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_sync_enabled" boolean DEFAULT true;