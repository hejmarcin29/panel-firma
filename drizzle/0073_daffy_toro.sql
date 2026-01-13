CREATE TABLE "erp_brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"image_url" text,
	"website" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "erp_brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"brand_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "erp_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "brand_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "collection_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "is_purchasable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "erp_collections" ADD CONSTRAINT "erp_collections_brand_id_erp_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."erp_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_brand_id_erp_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."erp_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_collection_id_erp_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."erp_collections"("id") ON DELETE no action ON UPDATE no action;