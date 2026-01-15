ALTER TABLE "orders" ADD COLUMN "type" text DEFAULT 'production' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_cost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_carrier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "notes" text;