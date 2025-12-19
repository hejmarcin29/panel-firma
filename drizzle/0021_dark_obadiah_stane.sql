ALTER TABLE "montages" ADD COLUMN "installation_date_confirmed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "contract_number" text;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "contract_date" timestamp;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "protocol_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "protocol_data" json;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "client_signature_url" text;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "installer_signature_url" text;