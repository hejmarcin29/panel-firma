ALTER TABLE "partner_commissions" ADD COLUMN "rate" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD COLUMN "area" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "montages" DROP COLUMN "commission_status";--> statement-breakpoint
ALTER TABLE "montages" DROP COLUMN "commission_amount";--> statement-breakpoint
ALTER TABLE "montages" DROP COLUMN "commission_paid_at";