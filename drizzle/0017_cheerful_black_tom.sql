ALTER TABLE "montages" ADD COLUMN "partner_id" text;--> statement-breakpoint
ALTER TABLE "montages" ADD CONSTRAINT "montages_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "montages_partner_id_idx" ON "montages" USING btree ("partner_id");