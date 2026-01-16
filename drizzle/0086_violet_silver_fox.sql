ALTER TABLE "manual_order_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "manual_orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_attachments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "manual_order_items" CASCADE;--> statement-breakpoint
DROP TABLE "manual_orders" CASCADE;--> statement-breakpoint
DROP TABLE "order_attachments" CASCADE;--> statement-breakpoint
ALTER TABLE "erp_order_timeline" DROP CONSTRAINT "erp_order_timeline_order_id_manual_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "erp_product_reviews" DROP CONSTRAINT "erp_product_reviews_order_id_manual_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "erp_order_timeline" ADD CONSTRAINT "erp_order_timeline_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_product_reviews" ADD CONSTRAINT "erp_product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;