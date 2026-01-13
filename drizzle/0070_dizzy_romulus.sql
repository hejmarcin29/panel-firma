CREATE TABLE "montage_floor_products" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"product_id" text,
	"name" text NOT NULL,
	"area" double precision DEFAULT 0 NOT NULL,
	"waste" double precision DEFAULT 0 NOT NULL,
	"installation_method" text DEFAULT 'click',
	"laying_direction" text,
	"rooms" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "montage_floor_products" ADD CONSTRAINT "montage_floor_products_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;