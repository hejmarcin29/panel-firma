ALTER TABLE "settlements" ADD COLUMN "override_amount" double precision;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "override_reason" text;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "corrections" json;