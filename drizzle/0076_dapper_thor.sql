CREATE TABLE "erp_order_timeline" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_product_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"rating" integer NOT NULL,
	"content" text,
	"author_name" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp_order_timeline" ADD CONSTRAINT "erp_order_timeline_order_id_manual_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."manual_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_reviews" ADD CONSTRAINT "erp_product_reviews_product_id_erp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."erp_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_reviews" ADD CONSTRAINT "erp_product_reviews_order_id_manual_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."manual_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "erp_timeline_order_idx" ON "erp_order_timeline" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "erp_reviews_product_idx" ON "erp_product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "erp_reviews_status_idx" ON "erp_product_reviews" USING btree ("status");