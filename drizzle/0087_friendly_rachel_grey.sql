CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"content" text,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"provider_id" text,
	"related_entity_id" varchar(255),
	"related_entity_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"available_variables" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_notification_logs_entity" ON "notification_logs" USING btree ("related_entity_id","related_entity_type");--> statement-breakpoint
CREATE INDEX "idx_notification_logs_created" ON "notification_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_event_channel" ON "notification_templates" USING btree ("event_id","channel");