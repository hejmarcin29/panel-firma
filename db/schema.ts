import { randomUUID } from "node:crypto";

import { relations } from "drizzle-orm";
import { blob, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { PartnerStatusOption } from "../src/lib/partners/schemas";
import type { UserRole } from "../src/lib/user-roles";

export { partnerStatuses } from "../src/lib/partners/schemas";
export { userRoles } from "../src/lib/user-roles";
export type { UserRole } from "../src/lib/user-roles";

export type PartnerStatus = PartnerStatusOption;

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull(),
    name: text("name"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username),
    emailIdx: index("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    session_user_idx: index("sessions_user_idx").on(table.userId),
    session_expires_idx: index("sessions_expires_idx").on(table.expiresAt),
  })
);

export const partners = sqliteTable(
  "partners",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "set null" })
      .unique(),
    companyName: text("company_name").notNull(),
    segment: text("segment"),
    region: text("region"),
    status: text("status").$type<PartnerStatus>().notNull().default("ROZWOJOWY"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    taxId: text("tax_id"),
    phone: text("phone"),
    email: text("email"),
    notes: text("notes"),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    archivedReason: text("archived_reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    partners_status_idx: index("partners_status_idx").on(table.status),
    partners_region_idx: index("partners_region_idx").on(table.region),
    partners_archived_idx: index("partners_archived_idx").on(table.archivedAt),
  })
);

export const partnerStatusHistory = sqliteTable(
  "partner_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    changedById: text("changed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fromStatus: text("from_status").$type<PartnerStatus>(),
    toStatus: text("to_status").$type<PartnerStatus>().notNull(),
    comment: text("comment"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    partner_status_history_partner_idx: index("partner_status_history_partner_idx").on(
      table.partnerId
    ),
    partner_status_history_changed_idx: index("partner_status_history_changed_idx").on(
      table.changedById
    ),
  })
);

export const installers = sqliteTable(
  "installers",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    code: text("code"),
    region: text("region"),
    bio: text("bio"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    clientNumber: integer("client_number").notNull().unique(),
    partnerId: text("partner_id").references(() => partners.id, {
      onDelete: "set null",
    }),
    fullName: text("full_name").notNull(),
    invoiceName: text("invoice_name"),
    invoiceTaxId: text("invoice_tax_id"),
    invoiceStreet: text("invoice_street"),
    invoiceCity: text("invoice_city"),
    invoicePostalCode: text("invoice_postal_code"),
    phone: text("phone"),
    email: text("email"),
    postalCode: text("postal_code"),
    city: text("city"),
    street: text("street"),
    acquisitionSource: text("acquisition_source"),
    additionalInfo: text("additional_info"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    client_partner_idx: index("clients_partner_idx").on(table.partnerId),
    client_email_idx: index("clients_email_idx").on(table.email),
    client_number_idx: index("clients_client_number_idx").on(table.clientNumber),
  })
);

export const productTypes = ["PANEL", "BASEBOARD", "ACCESSORY"] as const;
export type ProductType = (typeof productTypes)[number];

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    sku: text("sku"),
    type: text("type").$type<ProductType>().notNull(),
    style: text("style"),
    brand: text("brand"),
    color: text("color"),
    lengthMm: integer("length_mm"),
    widthMm: integer("width_mm"),
    thicknessMm: integer("thickness_mm"),
    unitPrice: real("unit_price"),
    metadata: blob("metadata"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    product_type_idx: index("products_type_idx").on(table.type),
    product_sku_idx: index("products_sku_idx").on(table.sku),
  })
);

export const orderExecutionModes = [
  "INSTALLATION_ONLY",
  "DELIVERY_ONLY",
] as const;
export type OrderExecutionMode = (typeof orderExecutionModes)[number];

export const orderStages = [
  "RECEIVED",
  "BEFORE_MEASUREMENT",
  "BEFORE_QUOTE",
  "AWAITING_DEPOSIT",
  "BEFORE_DELIVERY",
  "BEFORE_INSTALLATION",
  "AWAITING_FINAL_PAYMENT",
  "COMPLETED",
] as const;
export type OrderStage = (typeof orderStages)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    orderNumber: text("order_number").unique(),
    title: text("title"),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    partnerId: text("partner_id").references(() => partners.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    stage: text("stage").$type<OrderStage>().notNull(),
    stageNotes: text("stage_notes"),
    stageChangedAt: integer("stage_changed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    executionMode: text("execution_mode")
      .$type<OrderExecutionMode>()
      .notNull()
      .default("INSTALLATION_ONLY"),
    declaredFloorArea: real("declared_floor_area"),
    declaredBaseboardLength: real("declared_baseboard_length"),
    buildingType: text("building_type"),
    panelPreference: text("panel_preference"),
    baseboardPreference: text("baseboard_preference"),
    preferredPanelProductId: text("preferred_panel_product_id").references(
      () => products.id,
      { onDelete: "set null" }
    ),
    preferredBaseboardProductId: text("preferred_baseboard_product_id").references(
      () => products.id,
      { onDelete: "set null" }
    ),
    requiresAdminAttention: integer("requires_admin_attention", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    quoteSent: integer("quote_sent", { mode: "boolean" })
      .notNull()
      .default(false),
    depositInvoiceIssued: integer("deposit_invoice_issued", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    finalInvoiceIssued: integer("final_invoice_issued", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orders_client_idx: index("orders_client_idx").on(table.clientId),
    orders_stage_idx: index("orders_stage_idx").on(table.stage),
    orders_partner_idx: index("orders_partner_idx").on(table.partnerId),
    orders_owner_idx: index("orders_owner_idx").on(table.ownerId),
  })
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    changedById: text("changed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fromStage: text("from_stage").$type<OrderStage>(),
    toStage: text("to_stage").$type<OrderStage>().notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    order_status_history_order_idx: index("order_status_history_order_idx").on(
      table.orderId
    ),
    order_status_history_changed_idx: index("order_status_history_changed_idx").on(
      table.changedById
    ),
  })
);

export const deliveryTimingTypes = ["DAYS_BEFORE", "EXACT_DATE"] as const;
export type DeliveryTimingType = (typeof deliveryTimingTypes)[number];

export const measurements = sqliteTable(
  "measurements",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    measuredById: text("measured_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    measuredAt: integer("measured_at", { mode: "timestamp" }),
    measuredFloorArea: real("measured_floor_area"),
    measuredBaseboardLength: real("measured_baseboard_length"),
    offcutPercent: real("offcut_percent"),
    additionalNotes: text("additional_notes"),
    panelProductId: text("panel_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    deliveryTimingType: text("delivery_timing_type")
      .$type<DeliveryTimingType>()
      .notNull(),
    deliveryDaysBefore: integer("delivery_days_before"),
    deliveryDate: integer("delivery_date", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    measurements_order_idx: index("measurements_order_idx").on(table.orderId),
    measurements_measured_by_idx: index("measurements_measured_by_idx").on(
      table.measuredById
    ),
  })
);

export const measurementAdjustments = sqliteTable(
  "measurement_adjustments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    measurementId: text("measurement_id")
      .notNull()
      .references(() => measurements.id, { onDelete: "cascade" }),
    changedById: text("changed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    previousPayload: text("previous_payload"),
    nextPayload: text("next_payload"),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    measurement_adjustments_measurement_idx: index(
      "measurement_adjustments_measurement_idx"
    ).on(table.measurementId),
    measurement_adjustments_changed_idx: index(
      "measurement_adjustments_changed_idx"
    ).on(table.changedById),
  })
);

export const installationStatuses = [
  "PLANNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;
export type InstallationStatus = (typeof installationStatuses)[number];

export const installations = sqliteTable(
  "installations",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    installationNumber: text("installation_number").notNull().unique(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    assignedInstallerId: text("assigned_installer_id").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    status: text("status").$type<InstallationStatus>().notNull().default("PLANNED"),
    scheduledStartAt: integer("scheduled_start_at", { mode: "timestamp" }),
    scheduledEndAt: integer("scheduled_end_at", { mode: "timestamp" }),
    actualStartAt: integer("actual_start_at", { mode: "timestamp" }),
    actualEndAt: integer("actual_end_at", { mode: "timestamp" }),
    addressStreet: text("address_street"),
    addressCity: text("address_city"),
    addressPostalCode: text("address_postal_code"),
    locationPinUrl: text("location_pin_url"),
    panelProductId: text("panel_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    baseboardProductId: text("baseboard_product_id").references(
      () => products.id,
      { onDelete: "set null" }
    ),
    additionalWork: text("additional_work"),
    additionalInfo: text("additional_info"),
    customerNotes: text("customer_notes"),
    handoverProtocolSigned: integer("handover_protocol_signed", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    reviewReceived: integer("review_received", { mode: "boolean" })
      .notNull()
      .default(false),
    requiresAdminAttention: integer("requires_admin_attention", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    installations_order_idx: index("installations_order_idx").on(
      table.orderId
    ),
    installations_assigned_idx: index("installations_assigned_idx").on(
      table.assignedInstallerId
    ),
    installations_status_idx: index("installations_status_idx").on(table.status),
    installations_number_idx: index("installations_number_idx").on(
      table.installationNumber
    ),
  })
);

export const installationStatusHistory = sqliteTable(
  "installation_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    installationId: text("installation_id")
      .notNull()
      .references(() => installations.id, { onDelete: "cascade" }),
    changedById: text("changed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fromStatus: text("from_status").$type<InstallationStatus>(),
    toStatus: text("to_status").$type<InstallationStatus>().notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    installation_status_history_installation_idx: index(
      "installation_status_history_installation_idx"
    ).on(table.installationId),
    installation_status_history_changed_idx: index(
      "installation_status_history_changed_idx"
    ).on(table.changedById),
  })
);

export const deliveryTypes = ["FOR_INSTALLATION", "STANDALONE"] as const;
export type DeliveryType = (typeof deliveryTypes)[number];

export const deliveryStages = [
  "RECEIVED",
  "PROFORMA_SENT_AWAITING_PAYMENT",
  "SHIPPING_ORDERED",
  "DELIVERED_AWAITING_FINAL_INVOICE",
  "COMPLETED",
] as const;
export type DeliveryStage = (typeof deliveryStages)[number];

export const deliveries = sqliteTable(
  "deliveries",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    deliveryNumber: text("delivery_number").notNull().unique(),
    type: text("type").$type<DeliveryType>().notNull(),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    installationId: text("installation_id").references(() => installations.id, {
      onDelete: "set null",
    }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    scheduledDate: integer("scheduled_date", { mode: "timestamp" }),
    stage: text("stage").$type<DeliveryStage>().notNull(),
    includePanels: integer("include_panels", { mode: "boolean" })
      .notNull()
      .default(false),
    panelStyle: text("panel_style"),
    panelProductId: text("panel_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    includeBaseboards: integer("include_baseboards", { mode: "boolean" })
      .notNull()
      .default(false),
    baseboardProductId: text("baseboard_product_id").references(
      () => products.id,
      { onDelete: "set null" }
    ),
    shippingAddressStreet: text("shipping_address_street"),
    shippingAddressCity: text("shipping_address_city"),
    shippingAddressPostalCode: text("shipping_address_postal_code"),
    notes: text("notes"),
    proformaIssued: integer("proforma_issued", { mode: "boolean" })
      .notNull()
      .default(false),
    depositOrFinalInvoiceIssued: integer("deposit_final_invoice_issued", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    shippingOrdered: integer("shipping_ordered", { mode: "boolean" })
      .notNull()
      .default(false),
    reviewReceived: integer("review_received", { mode: "boolean" })
      .notNull()
      .default(false),
    requiresAdminAttention: integer("requires_admin_attention", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    deliveries_order_idx: index("deliveries_order_idx").on(table.orderId),
    deliveries_installation_idx: index("deliveries_installation_idx").on(
      table.installationId
    ),
    deliveries_client_idx: index("deliveries_client_idx").on(table.clientId),
    deliveries_stage_idx: index("deliveries_stage_idx").on(table.stage),
    deliveries_number_idx: index("deliveries_number_idx").on(table.deliveryNumber),
  })
);

export const deliveryStatusHistory = sqliteTable(
  "delivery_status_history",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    deliveryId: text("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    changedById: text("changed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fromStage: text("from_stage").$type<DeliveryStage>(),
    toStage: text("to_stage").$type<DeliveryStage>().notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    delivery_status_history_delivery_idx: index(
      "delivery_status_history_delivery_idx"
    ).on(table.deliveryId),
    delivery_status_history_changed_idx: index(
      "delivery_status_history_changed_idx"
    ).on(table.changedById),
  })
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    key: text("key").notNull().unique(),
    fileName: text("file_name").notNull(),
    description: text("description"),
    contentType: text("content_type"),
    fileSize: integer("file_size"),
    uploadedById: text("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    measurementId: text("measurement_id").references(() => measurements.id, {
      onDelete: "set null",
    }),
    installationId: text("installation_id").references(() => installations.id, {
      onDelete: "set null",
    }),
    deliveryId: text("delivery_id").references(() => deliveries.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    attachments_order_idx: index("attachments_order_idx").on(table.orderId),
    attachments_measurement_idx: index("attachments_measurement_idx").on(
      table.measurementId
    ),
    attachments_installation_idx: index("attachments_installation_idx").on(
      table.installationId
    ),
    attachments_delivery_idx: index("attachments_delivery_idx").on(
      table.deliveryId
    ),
  })
);

export const taskStatuses = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<TaskStatus>().notNull(),
    priority: text("priority").$type<TaskPriority>().notNull(),
    dueDate: integer("due_date", { mode: "timestamp" }),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    relatedOrderId: text("related_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    relatedInstallationId: text("related_installation_id").references(
      () => installations.id,
      { onDelete: "set null" }
    ),
    relatedDeliveryId: text("related_delivery_id").references(
      () => deliveries.id,
      { onDelete: "set null" }
    ),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tasks_order_idx: index("tasks_order_idx").on(table.relatedOrderId),
    tasks_installation_idx: index("tasks_installation_idx").on(
      table.relatedInstallationId
    ),
    tasks_delivery_idx: index("tasks_delivery_idx").on(table.relatedDeliveryId),
  })
);

export const settings = sqliteTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedById: text("updated_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  installers: many(installers),
  partnerProfile: one(partners, {
    fields: [users.id],
    references: [partners.userId],
  }),
  partnerStatusChanges: many(partnerStatusHistory),
  createdOrders: many(orders, { relationName: "orderCreatedBy" }),
  ownedOrders: many(orders, { relationName: "orderOwner" }),
  orderStatusChanges: many(orderStatusHistory),
  measurements: many(measurements, {
    relationName: "measurementMeasuredBy",
  }),
  measurementAdjustments: many(measurementAdjustments),
  installationsAssigned: many(installations, {
    relationName: "installationAssignedInstaller",
  }),
  installationStatusChanges: many(installationStatusHistory),
  deliveryStatusChanges: many(deliveryStatusHistory),
  attachments: many(attachments),
  tasksAssigned: many(tasks, { relationName: "taskAssignedTo" }),
  tasksCreated: many(tasks, { relationName: "taskCreatedBy" }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, {
    fields: [partners.userId],
    references: [users.id],
  }),
  clients: many(clients),
  orders: many(orders),
  statusHistory: many(partnerStatusHistory),
}));

export const partnerStatusHistoryRelations = relations(
  partnerStatusHistory,
  ({ one }) => ({
    partner: one(partners, {
      fields: [partnerStatusHistory.partnerId],
      references: [partners.id],
    }),
    changedBy: one(users, {
      fields: [partnerStatusHistory.changedById],
      references: [users.id],
    }),
  })
);

export const installersRelations = relations(installers, ({ one }) => ({
  user: one(users, {
    fields: [installers.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  partner: one(partners, {
    fields: [clients.partnerId],
    references: [partners.id],
  }),
  orders: many(orders),
  deliveries: many(deliveries),
}));

export const productsRelations = relations(products, ({ many }) => ({
  preferredPanelOrders: many(orders, {
    relationName: "orderPreferredPanelProduct",
  }),
  preferredBaseboardOrders: many(orders, {
    relationName: "orderPreferredBaseboardProduct",
  }),
  installationsPanel: many(installations, {
    relationName: "installationPanelProduct",
  }),
  installationsBaseboard: many(installations, {
    relationName: "installationBaseboardProduct",
  }),
  deliveriesPanel: many(deliveries, { relationName: "deliveryPanelProduct" }),
  deliveriesBaseboard: many(deliveries, {
    relationName: "deliveryBaseboardProduct",
  }),
  measurementPanel: many(measurements, {
    relationName: "measurementPanelProduct",
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
  partner: one(partners, {
    fields: [orders.partnerId],
    references: [partners.id],
  }),
  createdBy: one(users, {
    fields: [orders.createdById],
    references: [users.id],
    relationName: "orderCreatedBy",
  }),
  owner: one(users, {
    fields: [orders.ownerId],
    references: [users.id],
    relationName: "orderOwner",
  }),
  preferredPanelProduct: one(products, {
    fields: [orders.preferredPanelProductId],
    references: [products.id],
    relationName: "orderPreferredPanelProduct",
  }),
  preferredBaseboardProduct: one(products, {
    fields: [orders.preferredBaseboardProductId],
    references: [products.id],
    relationName: "orderPreferredBaseboardProduct",
  }),
  measurements: many(measurements),
  installations: many(installations),
  deliveries: many(deliveries),
  attachments: many(attachments),
  statusHistory: many(orderStatusHistory),
  tasks: many(tasks),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedBy: one(users, {
      fields: [orderStatusHistory.changedById],
      references: [users.id],
    }),
  })
);

export const measurementsRelations = relations(measurements, ({ one, many }) => ({
  order: one(orders, {
    fields: [measurements.orderId],
    references: [orders.id],
  }),
  measuredBy: one(users, {
    fields: [measurements.measuredById],
    references: [users.id],
    relationName: "measurementMeasuredBy",
  }),
  panelProduct: one(products, {
    fields: [measurements.panelProductId],
    references: [products.id],
    relationName: "measurementPanelProduct",
  }),
  attachments: many(attachments),
  adjustments: many(measurementAdjustments),
}));

export const measurementAdjustmentsRelations = relations(
  measurementAdjustments,
  ({ one }) => ({
    measurement: one(measurements, {
      fields: [measurementAdjustments.measurementId],
      references: [measurements.id],
    }),
    changedBy: one(users, {
      fields: [measurementAdjustments.changedById],
      references: [users.id],
    }),
  })
);

export const installationsRelations = relations(
  installations,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [installations.orderId],
      references: [orders.id],
    }),
    assignedInstaller: one(users, {
      fields: [installations.assignedInstallerId],
      references: [users.id],
      relationName: "installationAssignedInstaller",
    }),
    panelProduct: one(products, {
      fields: [installations.panelProductId],
      references: [products.id],
      relationName: "installationPanelProduct",
    }),
    baseboardProduct: one(products, {
      fields: [installations.baseboardProductId],
      references: [products.id],
      relationName: "installationBaseboardProduct",
    }),
    deliveries: many(deliveries),
    attachments: many(attachments),
    statusHistory: many(installationStatusHistory),
    tasks: many(tasks),
  })
);

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  installation: one(installations, {
    fields: [deliveries.installationId],
    references: [installations.id],
  }),
  client: one(clients, {
    fields: [deliveries.clientId],
    references: [clients.id],
  }),
  panelProduct: one(products, {
    fields: [deliveries.panelProductId],
    references: [products.id],
    relationName: "deliveryPanelProduct",
  }),
  baseboardProduct: one(products, {
    fields: [deliveries.baseboardProductId],
    references: [products.id],
    relationName: "deliveryBaseboardProduct",
  }),
  attachments: many(attachments),
  statusHistory: many(deliveryStatusHistory),
  tasks: many(tasks),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [attachments.uploadedById],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [attachments.orderId],
    references: [orders.id],
  }),
  measurement: one(measurements, {
    fields: [attachments.measurementId],
    references: [measurements.id],
  }),
  installation: one(installations, {
    fields: [attachments.installationId],
    references: [installations.id],
  }),
  delivery: one(deliveries, {
    fields: [attachments.deliveryId],
    references: [deliveries.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "taskAssignedTo",
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "taskCreatedBy",
  }),
  order: one(orders, {
    fields: [tasks.relatedOrderId],
    references: [orders.id],
  }),
  installation: one(installations, {
    fields: [tasks.relatedInstallationId],
    references: [installations.id],
  }),
  delivery: one(deliveries, {
    fields: [tasks.relatedDeliveryId],
    references: [deliveries.id],
  }),
}));
