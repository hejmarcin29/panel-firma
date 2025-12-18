CREATE TABLE "contract_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"template_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"content" text NOT NULL,
	"variables" json,
	"signed_at" timestamp,
	"signature_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"vat_rate" integer NOT NULL,
	"total_net" integer NOT NULL,
	"total_gross" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_date" timestamp,
	"expected_delivery_date" timestamp,
	"total_net" integer DEFAULT 0 NOT NULL,
	"total_gross" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'PLN' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"nip" text,
	"contact_person" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"reference_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "payout_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "referral_commissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "payout_requests" CASCADE;--> statement-breakpoint
DROP TABLE "referral_commissions" CASCADE;--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_referral_code_unique";--> statement-breakpoint
DROP INDEX "customers_referral_code_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_token" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_quote_id_idx" ON "contracts" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_token_idx" ON "users" USING btree ("referral_token");--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "referral_code";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "referral_balance";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "referred_by_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_token_unique" UNIQUE("referral_token");