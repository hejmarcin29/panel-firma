ALTER TABLE "products" ADD COLUMN "source" text DEFAULT 'woocommerce' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" text DEFAULT 'szt';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_rate" integer DEFAULT 23;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchase_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;