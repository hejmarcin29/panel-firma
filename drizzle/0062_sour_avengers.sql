ALTER TABLE "architect_products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "architect_products" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse_movements" DROP CONSTRAINT "warehouse_movements_product_id_products_id_fk";
