CREATE TABLE "erp_attribute_options" (
	"id" text PRIMARY KEY NOT NULL,
	"attribute_id" text NOT NULL,
	"value" text NOT NULL,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "erp_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'select',
	"category_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_product_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"attribute_id" text NOT NULL,
	"option_id" text,
	"value" text
);
--> statement-breakpoint
ALTER TABLE "erp_attribute_options" ADD CONSTRAINT "erp_attribute_options_attribute_id_erp_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."erp_attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_attributes" ADD CONSTRAINT "erp_attributes_category_id_erp_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."erp_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_attributes" ADD CONSTRAINT "erp_product_attributes_product_id_erp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."erp_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_attributes" ADD CONSTRAINT "erp_product_attributes_attribute_id_erp_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."erp_attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_attributes" ADD CONSTRAINT "erp_product_attributes_option_id_erp_attribute_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."erp_attribute_options"("id") ON DELETE no action ON UPDATE no action;