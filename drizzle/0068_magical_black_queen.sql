CREATE TABLE "global_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "is_shop_visible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "is_sample_available" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "package_size_m2" double precision;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transfer_title" text;