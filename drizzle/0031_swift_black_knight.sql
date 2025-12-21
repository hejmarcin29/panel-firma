ALTER TABLE "montages" ADD COLUMN "logistics_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "logistics_notes" text;--> statement-breakpoint
ALTER TABLE "montages" ADD COLUMN "cargo_checklist" json;