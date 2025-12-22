CREATE TABLE "erp_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"slug" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "erp_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"warehouse_id" text,
	"quantity_on_hand" double precision DEFAULT 0,
	"quantity_reserved" double precision DEFAULT 0,
	"quantity_available" double precision DEFAULT 0,
	"location" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"ean" text,
	"name" text NOT NULL,
	"description" text,
	"category_id" text,
	"unit" text DEFAULT 'szt',
	"width" double precision,
	"height" double precision,
	"length" double precision,
	"weight" double precision,
	"type" text DEFAULT 'product',
	"status" text DEFAULT 'active',
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "erp_products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "erp_purchase_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"supplier_sku" text,
	"net_price" double precision NOT NULL,
	"currency" text DEFAULT 'PLN',
	"vat_rate" double precision DEFAULT 0.23,
	"min_order_quantity" double precision DEFAULT 1,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"nip" text,
	"email" text,
	"phone" text,
	"website" text,
	"address" json,
	"bank_account" text,
	"payment_terms" integer DEFAULT 14,
	"description" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "erp_inventory" ADD CONSTRAINT "erp_inventory_product_id_erp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."erp_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_category_id_erp_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."erp_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_purchase_prices" ADD CONSTRAINT "erp_purchase_prices_product_id_erp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."erp_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_purchase_prices" ADD CONSTRAINT "erp_purchase_prices_supplier_id_erp_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."erp_suppliers"("id") ON DELETE no action ON UPDATE no action;