CREATE TABLE "montage_service_items" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"service_id" text NOT NULL,
	"quantity" double precision NOT NULL,
	"installer_rate" double precision NOT NULL,
	"client_price" double precision NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"vat_rate" double precision DEFAULT 0.23,
	"base_price_net" double precision DEFAULT 0,
	"base_installer_rate" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_service_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service_id" text NOT NULL,
	"custom_rate" double precision NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "montage_service_items" ADD CONSTRAINT "montage_service_items_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_service_items" ADD CONSTRAINT "montage_service_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_service_rates" ADD CONSTRAINT "user_service_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_service_rates" ADD CONSTRAINT "user_service_rates_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_service_rate_unq" ON "user_service_rates" USING btree ("user_id","service_id");