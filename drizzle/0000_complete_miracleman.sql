CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "board_columns" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_date" timestamp,
	"reminder_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"architect_id" text NOT NULL,
	"montage_id" text NOT NULL,
	"amount" integer NOT NULL,
	"rate" real NOT NULL,
	"area" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"tax_id" text,
	"billing_street" text,
	"billing_city" text,
	"billing_postal_code" text,
	"billing_country" text,
	"shipping_street" text,
	"shipping_city" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"architect_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_events" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"status" text NOT NULL,
	"actor_id" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"number" text,
	"issue_date" timestamp,
	"pdf_url" text,
	"gross_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"integration" text NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"provider" text,
	"status" text DEFAULT 'disabled' NOT NULL,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"imap_host" text,
	"imap_port" integer,
	"imap_secure" boolean DEFAULT true NOT NULL,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"username" text NOT NULL,
	"password_secret" text,
	"signature" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'custom' NOT NULL,
	"remote_id" text,
	"path" text,
	"sort_order" integer DEFAULT 0,
	"unread_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"folder_id" text NOT NULL,
	"subject" text,
	"from_address" text,
	"from_name" text,
	"to_recipients" text,
	"cc_recipients" text,
	"bcc_recipients" text,
	"reply_to" text,
	"snippet" text,
	"text_body" text,
	"html_body" text,
	"message_id" text,
	"thread_id" text,
	"external_id" text,
	"received_at" timestamp,
	"internal_date" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"vat_rate" integer NOT NULL,
	"unit_price_per_square_meter" integer,
	"total_net" integer NOT NULL,
	"total_gross" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"status" text NOT NULL,
	"channel" text NOT NULL,
	"notes" text,
	"timeline_task_overrides" text,
	"currency" text DEFAULT 'PLN' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"type" text DEFAULT 'production' NOT NULL,
	"source_order_id" text,
	"requires_review" boolean DEFAULT false NOT NULL,
	"total_net" integer NOT NULL,
	"total_gross" integer NOT NULL,
	"billing_name" text NOT NULL,
	"billing_street" text NOT NULL,
	"billing_postal_code" text NOT NULL,
	"billing_city" text NOT NULL,
	"billing_phone" text NOT NULL,
	"billing_email" text NOT NULL,
	"shipping_same_as_billing" boolean DEFAULT false NOT NULL,
	"shipping_name" text,
	"shipping_street" text,
	"shipping_postal_code" text,
	"shipping_city" text,
	"shipping_phone" text,
	"shipping_email" text,
	"payment_method" text,
	"shipping_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montage_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"note_id" text,
	"task_id" text,
	"title" text,
	"url" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montage_checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"template_id" text NOT NULL,
	"label" text NOT NULL,
	"allow_attachment" boolean DEFAULT false NOT NULL,
	"attachment_id" text,
	"completed" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montage_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"content" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montage_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"title" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "montages" (
	"id" text PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"contact_phone" text,
	"contact_email" text,
	"address" text,
	"billing_address" text,
	"installation_address" text,
	"billing_city" text,
	"installation_city" text,
	"billing_postal_code" text,
	"installation_postal_code" text,
	"is_company" boolean DEFAULT false NOT NULL,
	"company_name" text,
	"nip" text,
	"scheduled_installation_at" timestamp,
	"scheduled_installation_end_at" timestamp,
	"scheduled_skirting_installation_at" timestamp,
	"scheduled_skirting_installation_end_at" timestamp,
	"material_details" text,
	"measurement_details" text,
	"measurement_installation_method" text,
	"measurement_subfloor_condition" text,
	"measurement_additional_work_needed" boolean DEFAULT false,
	"measurement_additional_work_description" text,
	"measurement_separate_skirting" boolean DEFAULT false,
	"floor_area" double precision,
	"floor_details" text,
	"skirting_length" double precision,
	"skirting_details" text,
	"panel_model" text,
	"panel_waste" double precision,
	"skirting_model" text,
	"skirting_waste" double precision,
	"models_approved" boolean DEFAULT false NOT NULL,
	"final_panel_amount" double precision,
	"final_skirting_length" double precision,
	"materials_edit_history" json,
	"additional_info" text,
	"sketch_url" text,
	"forecasted_installation_date" timestamp,
	"status" text DEFAULT 'lead' NOT NULL,
	"display_id" text,
	"material_status" text DEFAULT 'none' NOT NULL,
	"material_claim_type" text,
	"installer_status" text DEFAULT 'none' NOT NULL,
	"installer_id" text,
	"measurer_id" text,
	"architect_id" text,
	"google_event_id" text,
	"technical_audit" json,
	"material_log" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"channel" text NOT NULL,
	"template_code" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"title" text,
	"url" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"tax_rate" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_order_id" text,
	"status" text NOT NULL,
	"customer_id" text,
	"total_net" integer NOT NULL,
	"total_gross" integer NOT NULL,
	"currency" text NOT NULL,
	"expected_ship_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"confidence_score" integer,
	"matched_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"payment_date" timestamp,
	"bank_operation_id" text,
	"raw_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_bank_operation_id_unique" UNIQUE("bank_operation_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sku" text,
	"price" text,
	"regular_price" text,
	"sale_price" text,
	"status" text NOT NULL,
	"stock_status" text,
	"stock_quantity" integer,
	"image_url" text,
	"categories" json,
	"attributes" json,
	"is_for_montage" boolean DEFAULT false,
	"montage_type" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"montage_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"items" json DEFAULT '[]'::json NOT NULL,
	"total_net" integer DEFAULT 0 NOT NULL,
	"total_gross" integer DEFAULT 0 NOT NULL,
	"valid_until" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"original_user_id" text,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "supplier_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_request_id" text NOT NULL,
	"direction" text NOT NULL,
	"medium" text NOT NULL,
	"subject" text,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp,
	"response_received_at" timestamp,
	"carrier" text,
	"tracking_number" text,
	"payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"roles" json DEFAULT '["admin"]'::json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"dashboard_config" json,
	"mobile_menu_config" json,
	"installer_profile" json,
	"architect_profile" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_tasks" ADD CONSTRAINT "board_tasks_column_id_board_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_architect_id_users_id_fk" FOREIGN KEY ("architect_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_architect_id_users_id_fk" FOREIGN KEY ("architect_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_folders" ADD CONSTRAINT "mail_folders_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_folder_id_mail_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."mail_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_order_items" ADD CONSTRAINT "manual_order_items_order_id_manual_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."manual_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_attachments" ADD CONSTRAINT "montage_attachments_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_attachments" ADD CONSTRAINT "montage_attachments_note_id_montage_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."montage_notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_attachments" ADD CONSTRAINT "montage_attachments_task_id_montage_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."montage_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_attachments" ADD CONSTRAINT "montage_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_checklist_items" ADD CONSTRAINT "montage_checklist_items_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_checklist_items" ADD CONSTRAINT "montage_checklist_items_attachment_id_montage_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."montage_attachments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_notes" ADD CONSTRAINT "montage_notes_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_notes" ADD CONSTRAINT "montage_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montage_tasks" ADD CONSTRAINT "montage_tasks_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montages" ADD CONSTRAINT "montages_installer_id_users_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montages" ADD CONSTRAINT "montages_measurer_id_users_id_fk" FOREIGN KEY ("measurer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "montages" ADD CONSTRAINT "montages_architect_id_users_id_fk" FOREIGN KEY ("architect_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_order_id_manual_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."manual_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_matches" ADD CONSTRAINT "payment_matches_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_montage_id_montages_id_fk" FOREIGN KEY ("montage_id") REFERENCES "public"."montages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_original_user_id_users_id_fk" FOREIGN KEY ("original_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_messages" ADD CONSTRAINT "supplier_messages_supplier_request_id_supplier_requests_id_fk" FOREIGN KEY ("supplier_request_id") REFERENCES "public"."supplier_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_requests" ADD CONSTRAINT "supplier_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_board_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."board_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_settings_updated_at_idx" ON "app_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "board_columns_order_idx" ON "board_columns" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "board_tasks_column_id_idx" ON "board_tasks" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "board_tasks_order_idx" ON "board_tasks" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "commissions_architect_id_idx" ON "commissions" USING btree ("architect_id");--> statement-breakpoint
CREATE INDEX "commissions_montage_id_idx" ON "commissions" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "commissions_status_idx" ON "commissions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tax_id_idx" ON "customers" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "document_events_document_id_idx" ON "document_events" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mail_accounts_email_idx" ON "mail_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "mail_accounts_status_idx" ON "mail_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mail_folders_account_id_idx" ON "mail_folders" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "mail_folders_remote_id_idx" ON "mail_folders" USING btree ("account_id","remote_id");--> statement-breakpoint
CREATE INDEX "mail_folders_kind_idx" ON "mail_folders" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "mail_messages_account_id_idx" ON "mail_messages" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "mail_messages_folder_id_idx" ON "mail_messages" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "mail_messages_received_at_idx" ON "mail_messages" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mail_messages_message_id_idx" ON "mail_messages" USING btree ("account_id","message_id");--> statement-breakpoint
CREATE INDEX "manual_order_items_order_id_idx" ON "manual_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "manual_orders_reference_idx" ON "manual_orders" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "manual_orders_created_at_idx" ON "manual_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "manual_orders_requires_review_idx" ON "manual_orders" USING btree ("requires_review");--> statement-breakpoint
CREATE INDEX "manual_orders_type_idx" ON "manual_orders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "montage_attachments_montage_id_idx" ON "montage_attachments" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "montage_attachments_note_id_idx" ON "montage_attachments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "montage_attachments_created_at_idx" ON "montage_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "montage_checklist_items_montage_id_idx" ON "montage_checklist_items" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "montage_checklist_items_completed_idx" ON "montage_checklist_items" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "montage_notes_montage_id_idx" ON "montage_notes" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "montage_notes_created_at_idx" ON "montage_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "montage_tasks_montage_id_idx" ON "montage_tasks" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "montage_tasks_completed_idx" ON "montage_tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "montages_status_idx" ON "montages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "montages_updated_at_idx" ON "montages" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "montages_display_id_idx" ON "montages" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "montages_installer_id_idx" ON "montages" USING btree ("installer_id");--> statement-breakpoint
CREATE INDEX "montages_measurer_id_idx" ON "montages" USING btree ("measurer_id");--> statement-breakpoint
CREATE INDEX "montages_architect_id_idx" ON "montages" USING btree ("architect_id");--> statement-breakpoint
CREATE INDEX "notifications_order_id_idx" ON "notifications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notifications_template_code_idx" ON "notifications" USING btree ("template_code");--> statement-breakpoint
CREATE INDEX "order_attachments_order_id_idx" ON "order_attachments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_attachments_created_at_idx" ON "order_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_source_idx" ON "orders" USING btree ("source","source_order_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "quotes_montage_id_idx" ON "quotes" USING btree ("montage_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "supplier_messages_request_idx" ON "supplier_messages" USING btree ("supplier_request_id");--> statement-breakpoint
CREATE INDEX "supplier_requests_status_idx" ON "supplier_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "system_logs_user_id_idx" ON "system_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");