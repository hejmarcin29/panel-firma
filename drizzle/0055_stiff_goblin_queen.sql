CREATE TABLE "montage_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invoice_number" text NOT NULL,
	"proforma_url" text,
	"invoice_url" text,
	"due_date" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "montage_payments" ADD CONSTRAINT "montage_payments_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "montage_payments_montage_id_idx" ON "montage_payments" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "montage_payments_status_idx" ON "montage_payments" USING btree ("status");