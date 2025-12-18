CREATE TABLE "partner_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"montage_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "partner_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invoice_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"rejection_reason" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partner_profile" json;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_payouts" ADD CONSTRAINT "partner_payouts_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_commissions_partner_id_idx" ON "partner_commissions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_commissions_montage_id_idx" ON "partner_commissions" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "partner_payouts_partner_id_idx" ON "partner_payouts" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_payouts_status_idx" ON "partner_payouts" USING btree ("status");