CREATE TABLE "architect_products" (
	"id" text PRIMARY KEY NOT NULL,
	"architect_id" text NOT NULL,
	"product_id" text NOT NULL,
	"is_exclusive" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "architect_products" ADD CONSTRAINT "architect_products_architect_id_users_id_fk" FOREIGN KEY ("architect_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architect_products" ADD CONSTRAINT "architect_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "architect_products_architect_id_idx" ON "architect_products" USING btree ("architect_id");--> statement-breakpoint
CREATE INDEX "architect_products_product_id_idx" ON "architect_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "architect_products_unique_idx" ON "architect_products" USING btree ("architect_id","product_id");