ALTER TABLE "montages" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "montages" ADD CONSTRAINT "montages_access_token_unique" UNIQUE("access_token");