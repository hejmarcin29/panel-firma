ALTER TABLE "orders" ADD COLUMN "assigned_installer_id" text REFERENCES "users"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "orders_assigned_installer_idx" ON "orders" ("assigned_installer_id");
