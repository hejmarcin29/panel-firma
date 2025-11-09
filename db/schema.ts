import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  real,
} from "drizzle-orm/sqlite-core";

export const userRoles = ["ADMIN", "MONTER", "SPRZEDAZ"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email", { length: 255 }).notNull().unique(),
    name: text("name", { length: 255 }).notNull(),
    passwordHash: text("password_hash", { length: 255 }).notNull(),
    role: text("role", { enum: userRoles }).notNull().default("SPRZEDAZ"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    emailIndex: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash", { length: 128 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const clients = sqliteTable(
  "clients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyName: text("company_name", { length: 255 }),
    contactName: text("contact_name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    phone: text("phone", { length: 32 }),
    city: text("city", { length: 120 }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    clientEmailIndex: uniqueIndex("clients_email_idx").on(table.email),
  }),
);

export const partners = sqliteTable(
  "partners",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 255 }).notNull(),
    status: text("status", { enum: ["AKTYWNY", "WSTRZYMANY", "ARCHIWALNY"] })
      .notNull()
      .default("AKTYWNY"),
    segment: text("segment", { length: 120 }).default("STANDARD"),
    region: text("region", { length: 120 }),
    contactEmail: text("contact_email", { length: 255 }),
    contactPhone: text("contact_phone", { length: 32 }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    partnerNameIndex: uniqueIndex("partners_name_idx").on(table.name),
  }),
);

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sku: text("sku", { length: 64 }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    category: text("category", {
      enum: ["PANEL", "AKCESORIA", "USLUGA_MONTAZ", "SERWIS"],
    }).notNull(),
    unit: text("unit", { length: 32 }).notNull().default("szt"),
    unitPriceNet: integer("unit_price_net").notNull().default(0),
    vatRate: real("vat_rate").notNull().default(0.23),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    productsSkuIndex: uniqueIndex("products_sku_idx").on(table.sku),
  }),
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number", { length: 64 }).notNull(),
    type: text("type", { enum: ["MONTAZ", "DROPSHIPPING"] })
      .notNull()
      .default("MONTAZ"),
    status: text("status", {
      enum: ["NOWE", "PLANOWANE", "W_REALIZACJI", "WYSŁANE", "ZREALIZOWANE", "ANULOWANE"],
    }).notNull().default("NOWE"),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    partnerId: integer("partner_id").references(() => partners.id),
    ownerId: integer("owner_id").references(() => users.id),
    scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }),
    deliveryWindowFrom: integer("delivery_window_from", { mode: "timestamp_ms" }),
    deliveryWindowTo: integer("delivery_window_to", { mode: "timestamp_ms" }),
    totalNetValue: integer("total_net_value").notNull().default(0),
    totalVatValue: integer("total_vat_value").notNull().default(0),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    orderNumberIndex: uniqueIndex("orders_number_idx").on(table.orderNumber),
  }),
);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitPriceNet: integer("unit_price_net").notNull().default(0),
  discountNet: integer("discount_net").notNull().default(0),
});

export const installations = sqliteTable("installations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  addressLine: text("address_line", { length: 255 }).notNull(),
  postalCode: text("postal_code", { length: 12 }).notNull(),
  city: text("city", { length: 120 }).notNull(),
  province: text("province", { length: 120 }),
  installerName: text("installer_name", { length: 255 }),
  scopeSummary: text("scope_summary"),
  plannedAt: integer("planned_at", { mode: "timestamp_ms" }),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  status: text("status", {
    enum: ["DO_PRZYGOTOWANIA", "ZAPLANOWANY", "W_TRAKCIE", "ZAMKNIETY"],
  })
    .notNull()
    .default("DO_PRZYGOTOWANIA"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const shipments = sqliteTable("shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  carrier: text("carrier", { length: 120 }),
  trackingNumber: text("tracking_number", { length: 120 }),
  status: text("status", {
    enum: ["OCZEKUJE", "WYSŁANE", "DOSTARCZONE", "PROBLEM"],
  })
    .notNull()
    .default("OCZEKUJE"),
  shippedAt: integer("shipped_at", { mode: "timestamp_ms" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["NOWE", "PLANOWANE", "W_REALIZACJI", "WYSŁANE", "ZREALIZOWANE", "ANULOWANE"],
  }).notNull(),
  comment: text("comment"),
  changedBy: integer("changed_by").references(() => users.id),
  changedAt: integer("changed_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const inventorySnapshots = sqliteTable("inventory_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  quantityReserved: integer("quantity_reserved").notNull().default(0),
  warehouse: text("warehouse", { length: 120 }).default("DOMYŚLNY"),
  capturedAt: integer("captured_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const partnerAssignments = sqliteTable("partner_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const dropshippingStages = [
  "LEAD",
  "PROFORMA_WYSLANA",
  "ZALICZKA_OPLACONA",
  "ZAMOWIENIE_DO_DOSTAWCY",
  "DOSTAWA_POTWIERDZONA",
  "FAKTURA_KONCOWA",
] as const;
export type DropshippingStage = (typeof dropshippingStages)[number];

export const dropshippingOrders = sqliteTable(
  "dropshipping_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number", { length: 32 }).notNull().unique(),
    year: integer("year").notNull(),
    sequence: integer("sequence").notNull(),
    clientName: text("client_name", { length: 255 }).notNull(),
    channel: text("channel", { length: 64 }).notNull(),
    channelReference: text("channel_reference", { length: 128 }),
    goodsDescription: text("goods_description"),
    packagesCount: integer("packages_count").notNull().default(0),
    areaM2: real("area_m2"),
    netValue: integer("net_value").notNull().default(0),
    grossValue: integer("gross_value").notNull().default(0),
    vatRate: real("vat_rate").notNull().default(0.23),
    supplier: text("supplier", { length: 255 }),
    notes: text("notes"),
    status: text("status", { enum: dropshippingStages }).notNull().default("LEAD"),
    proformaIssuedAt: integer("proforma_issued_at", { mode: "timestamp_ms" }),
    depositPaidAt: integer("deposit_paid_at", { mode: "timestamp_ms" }),
    supplierOrderAt: integer("supplier_order_at", { mode: "timestamp_ms" }),
    deliveryConfirmedAt: integer("delivery_confirmed_at", { mode: "timestamp_ms" }),
    finalInvoiceAt: integer("final_invoice_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now') * 1000)`),
  },
  (table) => ({
    sequenceIndex: uniqueIndex("dropshipping_orders_year_sequence_idx").on(table.year, table.sequence),
  }),
);

export const dropshippingOrderItems = sqliteTable("dropshipping_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => dropshippingOrders.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  title: text("title", { length: 255 }).notNull(),
  packagesCount: integer("packages_count").notNull().default(0),
  areaM2: real("area_m2"),
  pricePerPackage: integer("price_per_package").notNull().default(0),
  pricePerSquareMeter: integer("price_per_square_meter").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const dropshippingChecklistItems = sqliteTable("dropshipping_checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => dropshippingOrders.id, { onDelete: "cascade" }),
  title: text("title", { length: 255 }).notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  isOptional: integer("is_optional", { mode: "boolean" }).notNull().default(false),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});
