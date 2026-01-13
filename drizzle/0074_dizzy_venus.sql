CREATE TABLE "erp_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"excerpt" text,
	"featured_image" text,
	"meta_title" text,
	"meta_description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp_posts" ADD CONSTRAINT "erp_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "erp_posts_slug_idx" ON "erp_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "erp_posts_status_idx" ON "erp_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "erp_posts_published_at_idx" ON "erp_posts" USING btree ("published_at");