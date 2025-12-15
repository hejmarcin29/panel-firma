CREATE TABLE "payout_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reward_type" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"beneficiary_customer_id" text NOT NULL,
	"amount" integer NOT NULL,
	"floor_area" real NOT NULL,
	"rate_per_sqm" integer DEFAULT 1000 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referral_token" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referral_balance" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referred_by_id" text;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_beneficiary_customer_id_customers_id_fk" FOREIGN KEY ("beneficiary_customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_requests_customer_id_idx" ON "payout_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payout_requests_status_idx" ON "payout_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_commissions_montage_id_idx" ON "referral_commissions" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "referral_commissions_beneficiary_id_idx" ON "referral_commissions" USING btree ("beneficiary_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_referral_token_idx" ON "customers" USING btree ("referral_token");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_referral_code_idx" ON "customers" USING btree ("referral_code");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_referral_token_unique" UNIQUE("referral_token");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_referral_code_unique" UNIQUE("referral_code");