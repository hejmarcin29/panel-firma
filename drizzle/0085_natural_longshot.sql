ALTER TABLE "documents" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "montage_id" text;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;