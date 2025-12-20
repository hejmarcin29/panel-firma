DROP TABLE "contracts" CASCADE;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "terms_content" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "signature_data" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "final_pdf_url" text;