ALTER TABLE "montage_attachments" ADD COLUMN "type" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "montage_checklist_items" DROP COLUMN "assigned_role";