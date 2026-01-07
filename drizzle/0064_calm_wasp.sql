ALTER TABLE "erp_products" ADD COLUMN "supplier_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "supplier_sku" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "purchase_price_net" double precision;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "purchase_price_updated" timestamp;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_supplier_id_erp_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."erp_suppliers"("id") ON DELETE no action ON UPDATE no action;