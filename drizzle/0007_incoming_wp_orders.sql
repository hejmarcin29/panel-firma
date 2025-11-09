CREATE TABLE IF NOT EXISTS "incoming_wp_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "wp_order_id" text(64) NOT NULL,
  "wp_order_number" text(64) NOT NULL,
  "wp_status" text(64) NOT NULL DEFAULT 'pending',
  "status" text NOT NULL DEFAULT 'NEW',
  "customer_name" text(255),
  "customer_email" text(255),
  "total_net" integer NOT NULL DEFAULT 0,
  "total_gross" integer NOT NULL DEFAULT 0,
  "currency" text(8) NOT NULL DEFAULT 'PLN',
  "contains_vinyl_panels" integer NOT NULL DEFAULT 0,
  "categories_json" text,
  "raw_payload" text NOT NULL,
  "received_at" integer NOT NULL DEFAULT (unixepoch('now') * 1000),
  "imported_at" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch('now') * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS "incoming_wp_orders_wp_order_id_idx"
  ON "incoming_wp_orders" ("wp_order_id");
