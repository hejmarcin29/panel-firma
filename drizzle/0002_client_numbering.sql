ALTER TABLE "clients" ADD COLUMN "client_number" integer NOT NULL DEFAULT 0;
ALTER TABLE "installations" ADD COLUMN "installation_number" text NOT NULL DEFAULT 'TEMP';
ALTER TABLE "deliveries" ADD COLUMN "delivery_number" text NOT NULL DEFAULT 'TEMP';

WITH numbered_clients AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id") - 1 AS rn
  FROM "clients"
)
UPDATE "clients"
SET "client_number" = numbered_clients.rn
FROM numbered_clients
WHERE numbered_clients.id = "clients"."id";

WITH numbered_installations AS (
  SELECT i."id", c."client_number", ROW_NUMBER() OVER (PARTITION BY o."client_id" ORDER BY i."created_at", i."id") AS seq
  FROM "installations" i
  JOIN "orders" o ON o."id" = i."order_id"
  JOIN "clients" c ON c."id" = o."client_id"
)
UPDATE "installations"
SET "installation_number" = numbered_installations."client_number" || '_M_' || numbered_installations.seq
FROM numbered_installations
WHERE numbered_installations.id = "installations"."id";

WITH numbered_deliveries AS (
  SELECT d."id", c."client_number", ROW_NUMBER() OVER (PARTITION BY d."client_id" ORDER BY d."created_at", d."id") AS seq
  FROM "deliveries" d
  JOIN "clients" c ON c."id" = d."client_id"
)
UPDATE "deliveries"
SET "delivery_number" = numbered_deliveries."client_number" || '_D_' || numbered_deliveries.seq
FROM numbered_deliveries
WHERE numbered_deliveries.id = "deliveries"."id";

CREATE UNIQUE INDEX "clients_client_number_idx" ON "clients" ("client_number");
CREATE UNIQUE INDEX "installations_number_idx" ON "installations" ("installation_number");
CREATE UNIQUE INDEX "deliveries_number_idx" ON "deliveries" ("delivery_number");
