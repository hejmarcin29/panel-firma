ALTER TABLE "montages" ADD COLUMN "skirting_material_status" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "skirting_material_claim_type" text;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "skirting_protocol_data" json;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "skirting_client_signature_url" text;