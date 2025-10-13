PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "delivery_status_history";
DROP TABLE IF EXISTS "deliveries";
DROP TABLE IF EXISTS "measurement_notes_history";
DROP TABLE IF EXISTS "measurements";
DROP TABLE IF EXISTS "tasks";
DROP TABLE IF EXISTS "files";
DROP TABLE IF EXISTS "installation_status_history";
DROP TABLE IF EXISTS "installations";

CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text,
	"title" text,
	"client_id" text NOT NULL,
	"partner_id" text,
	"created_by_id" text,
	"owner_id" text,
	"stage" text NOT NULL,
	"stage_notes" text,
	"stage_changed_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"declared_floor_area" real,
	"declared_baseboard_length" real,
	"building_type" text,
	"panel_preference" text,
	"baseboard_preference" text,
	"preferred_panel_product_id" text,
	"preferred_baseboard_product_id" text,
	"requires_admin_attention" integer NOT NULL DEFAULT 1,
	"quote_sent" integer NOT NULL DEFAULT 0,
	"deposit_invoice_issued" integer NOT NULL DEFAULT 0,
	"final_invoice_issued" integer NOT NULL DEFAULT 0,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"updated_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("preferred_panel_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("preferred_baseboard_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "orders_client_idx" ON "orders" ("client_id");
CREATE INDEX "orders_stage_idx" ON "orders" ("stage");
CREATE INDEX "orders_partner_idx" ON "orders" ("partner_id");
CREATE INDEX "orders_owner_idx" ON "orders" ("owner_id");

CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"changed_by_id" text,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"note" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "order_status_history_order_idx" ON "order_status_history" ("order_id");
CREATE INDEX "order_status_history_changed_idx" ON "order_status_history" ("changed_by_id");

CREATE TABLE "measurements" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"measured_by_id" text,
	"scheduled_at" integer,
	"measured_at" integer,
	"measured_floor_area" real,
	"measured_baseboard_length" real,
	"offcut_percent" real,
	"additional_notes" text,
	"panel_product_id" text,
	"delivery_timing_type" text NOT NULL,
	"delivery_days_before" integer,
	"delivery_date" integer,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"updated_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("measured_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("panel_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "measurements_order_idx" ON "measurements" ("order_id");
CREATE INDEX "measurements_measured_by_idx" ON "measurements" ("measured_by_id");

CREATE TABLE "measurement_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"measurement_id" text NOT NULL,
	"changed_by_id" text,
	"previous_payload" text,
	"next_payload" text,
	"reason" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "measurement_adjustments_measurement_idx" ON "measurement_adjustments" ("measurement_id");
CREATE INDEX "measurement_adjustments_changed_idx" ON "measurement_adjustments" ("changed_by_id");

CREATE TABLE "installations" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"assigned_installer_id" text,
	"status" text NOT NULL DEFAULT 'PLANNED',
	"scheduled_start_at" integer,
	"scheduled_end_at" integer,
	"actual_start_at" integer,
	"actual_end_at" integer,
	"address_street" text,
	"address_city" text,
	"address_postal_code" text,
	"location_pin_url" text,
	"panel_product_id" text,
	"baseboard_product_id" text,
	"additional_work" text,
	"additional_info" text,
	"customer_notes" text,
	"handover_protocol_signed" integer NOT NULL DEFAULT 0,
	"review_received" integer NOT NULL DEFAULT 0,
	"requires_admin_attention" integer NOT NULL DEFAULT 1,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"updated_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("assigned_installer_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("panel_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("baseboard_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "installations_order_idx" ON "installations" ("order_id");
CREATE INDEX "installations_assigned_idx" ON "installations" ("assigned_installer_id");
CREATE INDEX "installations_status_idx" ON "installations" ("status");

CREATE TABLE "installation_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"installation_id" text NOT NULL,
	"changed_by_id" text,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "installation_status_history_installation_idx" ON "installation_status_history" ("installation_id");
CREATE INDEX "installation_status_history_changed_idx" ON "installation_status_history" ("changed_by_id");

CREATE TABLE "deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"order_id" text,
	"installation_id" text,
	"client_id" text NOT NULL,
	"scheduled_date" integer,
	"stage" text NOT NULL,
	"include_panels" integer NOT NULL DEFAULT 0,
	"panel_style" text,
	"panel_product_id" text,
	"include_baseboards" integer NOT NULL DEFAULT 0,
	"baseboard_product_id" text,
	"shipping_address_street" text,
	"shipping_address_city" text,
	"shipping_address_postal_code" text,
	"notes" text,
	"proforma_issued" integer NOT NULL DEFAULT 0,
	"deposit_final_invoice_issued" integer NOT NULL DEFAULT 0,
	"shipping_ordered" integer NOT NULL DEFAULT 0,
	"review_received" integer NOT NULL DEFAULT 0,
	"requires_admin_attention" integer NOT NULL DEFAULT 1,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"updated_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("panel_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("baseboard_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "deliveries_order_idx" ON "deliveries" ("order_id");
CREATE INDEX "deliveries_installation_idx" ON "deliveries" ("installation_id");
CREATE INDEX "deliveries_client_idx" ON "deliveries" ("client_id");
CREATE INDEX "deliveries_stage_idx" ON "deliveries" ("stage");

CREATE TABLE "delivery_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"changed_by_id" text,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"note" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "delivery_status_history_delivery_idx" ON "delivery_status_history" ("delivery_id");
CREATE INDEX "delivery_status_history_changed_idx" ON "delivery_status_history" ("changed_by_id");

CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"file_name" text NOT NULL,
	"description" text,
	"content_type" text,
	"file_size" integer,
	"uploaded_by_id" text,
	"order_id" text,
	"measurement_id" text,
	"installation_id" text,
	"delivery_id" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE set null ON UPDATE no action
);

CREATE UNIQUE INDEX "attachments_key_unique" ON "attachments" ("key");
CREATE INDEX "attachments_order_idx" ON "attachments" ("order_id");
CREATE INDEX "attachments_measurement_idx" ON "attachments" ("measurement_id");
CREATE INDEX "attachments_installation_idx" ON "attachments" ("installation_id");
CREATE INDEX "attachments_delivery_idx" ON "attachments" ("delivery_id");

CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"due_date" integer,
	"assigned_to_id" text,
	"related_order_id" text,
	"related_installation_id" text,
	"related_delivery_id" text,
	"created_by_id" text,
	"created_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"updated_at" integer NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("related_order_id") REFERENCES "orders"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("related_installation_id") REFERENCES "installations"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("related_delivery_id") REFERENCES "deliveries"("id") ON DELETE set null ON UPDATE no action,
	FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX "tasks_order_idx" ON "tasks" ("related_order_id");
CREATE INDEX "tasks_installation_idx" ON "tasks" ("related_installation_id");
CREATE INDEX "tasks_delivery_idx" ON "tasks" ("related_delivery_id");

PRAGMA foreign_keys=ON;
