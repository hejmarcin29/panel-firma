ALTER TABLE "montage_service_items" ADD COLUMN "snapshot_name" text;--> statement-breakpoint
ALTER TABLE "montage_service_items" ADD COLUMN "vat_rate" double precision DEFAULT 0.23;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "deleted_at" timestamp;