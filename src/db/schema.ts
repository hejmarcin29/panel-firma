import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // uuid (string)
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  // Custom fields
  role: text("role").notNull().default("admin"), // 'admin' | 'installer' | 'architect' | 'manager'
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export type User = typeof users.$inferSelect;

// Clients
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(), // uuid text
  name: text("name").notNull(), // Imię i nazwisko
  companyName: text("company_name"), // nazwa firmy (opcjonalnie)
  phone: text("phone"), // numer tel.
  email: text("email"), // email (niekoniecznie unikalny na start)
  // Dane firmy (opcjonalnie)
  taxId: text("tax_id"), // NIP (opcjonalnie, gdy firma)
  invoiceCity: text("invoice_city"), // miasto (faktura)
  invoicePostalCode: text("invoice_postal_code"), // kod pocztowy (faktura)
  invoiceAddress: text("invoice_address"), // adres (faktura)
  // Fakturowanie (preferencje)
  preferVatInvoice: integer("prefer_vat_invoice", { mode: "boolean" })
    .notNull()
    .default(false),
  buyerType: text("buyer_type"), // 'person' | 'company'
  invoiceEmail: text("invoice_email"), // dedykowany email do faktury
  eInvoiceConsent: integer("e_invoice_consent", { mode: "boolean" })
    .notNull()
    .default(false),
  deliveryCity: text("delivery_city"), // miasto (dostawa)
  deliveryAddress: text("delivery_address"), // adres (dostawa)
  // Typ usługi: tylko dostawa czy z montażem
  serviceType: text("service_type").notNull().default("with_installation"), // 'delivery_only' | 'with_installation'
  // Źródło pozyskania klienta (opcjonalne): np. "Polecenie", "Strona WWW", "Facebook", "Google", itp.
  source: text("source"),
  // Publiczny numer klienta do wyświetlania ("Nr klienta"), rosnący od 10
  clientNo: integer("client_no").unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
});

export type Client = typeof clients.$inferSelect;

export const clientNotes = sqliteTable("client_notes", {
  id: text("id").primaryKey(), // uuid text
  clientId: text("client_id").notNull(),
  content: text("content").notNull(), // notatka Primepodloga
  createdBy: text("created_by"), // users.id (opcjonalnie)
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type ClientNote = typeof clientNotes.$inferSelect;

// Domain Events (Event Store Phase 1)
export const domainEvents = sqliteTable("domain_events", {
  id: text("id").primaryKey(), // uuid
  type: text("type").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  actor: text("actor"), // email / system
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  payload: text("payload"), // JSON string (minimal fields)
  schemaVersion: integer("schema_version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type DomainEvent = typeof domainEvents.$inferSelect;

// Orders (Zlecenia) – iteracja 1
// type: 'delivery' | 'installation'
// status lifecycle (minimal):
//  - awaiting_measurement (tylko dla installation)
//  - ready_to_schedule (delivery od razu; installation po pomiarze)
//  - scheduled
//  - completed
//  - cancelled
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(), // uuid
    clientId: text("client_id").notNull(),
    type: text("type").notNull(), // 'delivery' | 'installation'
    status: text("status").notNull(), // patrz komentarz wyżej
    requiresMeasurement: integer("requires_measurement", { mode: "boolean" })
      .notNull()
      .default(false),
    scheduledDate: integer("scheduled_date", { mode: "timestamp_ms" }), // planowana data dostawy/montażu (opc.)
    // Lokalizacja zlecenia (opcjonalnie; docelowo zamiast pól dostawy u klienta)
    locationCity: text("location_city"),
    locationPostalCode: text("location_postal_code"),
    locationAddress: text("location_address"),
    installerId: text("installer_id"), // users.id (rola: installer)
    preMeasurementSqm: integer("pre_measurement_sqm"), // szacunkowe m2 przed pomiarem
    internalNote: text("internal_note"), // notatka Primepodloga (aktualny stan)
    internalNoteUpdatedAt: integer("internal_note_updated_at", {
      mode: "timestamp_ms",
    }),
    // Numer porządkowy zlecenia w ramach klienta (1,2,3,...)
    seq: integer("seq"),
    // Publiczny numer zlecenia w formacie "<Nr klienta>_<seq>", np. "10_1"
    orderNo: text("order_no"),
    // Wynik biznesowy (pipeline): 'won' | 'lost' | null
    outcome: text("outcome"),
    outcomeAt: integer("outcome_at", { mode: "timestamp_ms" }),
    outcomeReasonCode: text("outcome_reason_code"),
    outcomeReasonNote: text("outcome_reason_note"),
    // Biznesowy etap (pipeline) – zależny od type
    pipelineStage: text("pipeline_stage"),
    pipelineStageUpdatedAt: integer("pipeline_stage_updated_at", {
      mode: "timestamp_ms",
    }),
    // Montaż – dodatkowe informacje (opcjonalne)
    // Proponowana cena montażu w groszach (integer). UI wprowadza w PLN.
    proposedInstallPriceCents: integer("proposed_install_price_cents"),
    // Typ budynku: 'house' (Dom) | 'apartment' (Blok)
    buildingType: text("building_type"),
    // Preferowany przedział czasowy montażu (data od/do – bez godzin)
    desiredInstallFrom: integer("desired_install_from", { mode: "timestamp_ms" }),
    desiredInstallTo: integer("desired_install_to", { mode: "timestamp_ms" }),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }), // data archiwizacji (opc.)
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    // unikalność numeru zlecenia jako tekstu (jeśli utrwalamy)
    orderNoUnique: uniqueIndex("orders_order_no_unique").on(table.orderNo),
    // unikalność (client_id, seq) w ramach klienta
    orderSeqPerClientUnique: uniqueIndex("orders_client_seq_unique").on(
      table.clientId,
      table.seq,
    ),
  }),
);

export type Order = typeof orders.$inferSelect;

// Historia edycji notatki zamówienia (append-only)
export const orderNoteHistory = sqliteTable("order_note_history", {
  id: text("id").primaryKey(), // uuid
  orderId: text("order_id").notNull(),
  content: text("content").notNull(),
  editedBy: text("edited_by"), // email
  editedAt: integer("edited_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type OrderNoteHistory = typeof orderNoteHistory.$inferSelect;

// Cooperation Rules (Zasady współpracy)
export const cooperationRules = sqliteTable(
  "cooperation_rules",
  {
    id: text("id").primaryKey(), // uuid
    title: text("title").notNull(),
    contentMd: text("content_md").notNull(),
    version: integer("version").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(false),
    requiresAck: integer("requires_ack", { mode: "boolean" })
      .notNull()
      .default(true),
    audienceJson: text("audience_json").notNull().default('["installer"]'), // JSON array ról
    effectiveFrom: integer("effective_from", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    uniqueActiveVersion: uniqueIndex("cooperation_rules_active_version").on(
      table.version,
    ),
  }),
);

export type CooperationRule = typeof cooperationRules.$inferSelect;

export const cooperationRuleAcks = sqliteTable(
  "cooperation_rule_acks",
  {
    id: text("id").primaryKey(), // uuid
    ruleId: text("rule_id").notNull(),
    userId: text("user_id").notNull(),
    version: integer("version").notNull(),
    acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    uniqAckPerUserVersion: uniqueIndex("cooperation_rule_ack_user_version").on(
      table.userId,
      table.version,
    ),
  }),
);

export type CooperationRuleAck = typeof cooperationRuleAcks.$inferSelect;

// Delivery schedule entries (1:N per order)
export const deliverySlots = sqliteTable(
  "delivery_slots",
  {
    id: text("id").primaryKey(), // uuid
    orderId: text("order_id").notNull(),
    plannedAt: integer("planned_at", { mode: "timestamp_ms" }),
    windowStart: integer("window_start", { mode: "timestamp_ms" }),
    windowEnd: integer("window_end", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("planned"), // 'planned' | 'confirmed' | 'completed' | 'canceled'
    carrier: text("carrier"),
    trackingNo: text("tracking_no"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    idxOrder: index("delivery_slots_order_id_idx").on(table.orderId),
    idxStatusPlanned: index("delivery_slots_status_planned_idx").on(
      table.status,
      table.plannedAt,
    ),
  }),
);

export type DeliverySlot = typeof deliverySlots.$inferSelect;

// Installation schedule entries (1:N per order)
export const installationSlots = sqliteTable(
  "installation_slots",
  {
    id: text("id").primaryKey(), // uuid
    orderId: text("order_id").notNull(),
    plannedAt: integer("planned_at", { mode: "timestamp_ms" }),
    windowStart: integer("window_start", { mode: "timestamp_ms" }),
    windowEnd: integer("window_end", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("planned"), // 'planned' | 'confirmed' | 'completed' | 'canceled'
    installerId: text("installer_id"),
    durationMinutes: integer("duration_minutes"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    idxOrder: index("installation_slots_order_id_idx").on(table.orderId),
    idxInstallerPlanned: index("installation_slots_installer_planned_idx").on(
      table.installerId,
      table.plannedAt,
    ),
    idxStatusPlanned: index("installation_slots_status_planned_idx").on(
      table.status,
      table.plannedAt,
    ),
  }),
);

export type InstallationSlot = typeof installationSlots.$inferSelect;

// Delivery items (pozycje dostawy) — powiązane z delivery_slots
export const deliveryItems = sqliteTable(
  "delivery_items",
  {
    id: text("id").primaryKey(), // uuid
    slotId: text("slot_id").notNull(), // delivery_slots.id
    name: text("name").notNull(),
    sqmCenti: integer("sqm_centi"), // m2 * 100 (np. 23.45 m2 => 2345)
    packs: integer("packs"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    idxSlot: index("delivery_items_slot_idx").on(table.slotId),
  }),
);

export type DeliveryItem = typeof deliveryItems.$inferSelect;

// Google Calendar preferences per installer
export const installerGooglePrefs = sqliteTable("installer_google_prefs", {
  userId: text("user_id").primaryKey(),
  calendarId: text("calendar_id"),
  timeZone: text("time_zone").notNull().default("Europe/Warsaw"),
  defaultReminderMinutes: integer("default_reminder_minutes")
    .notNull()
    .default(60),
  autoSync: integer("auto_sync", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type InstallerGooglePrefs = typeof installerGooglePrefs.$inferSelect;

// Mapping of local orders to Google Calendar event IDs
export const orderGoogleEvents = sqliteTable("order_google_events", {
  orderId: text("order_id").primaryKey(),
  installerId: text("installer_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  googleEventId: text("google_event_id").notNull(),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type OrderGoogleEvent = typeof orderGoogleEvents.$inferSelect;

// Installer private tasks (personal to-do list)
export const installerPrivateTasks = sqliteTable("installer_private_tasks", {
  id: text("id").primaryKey(), // uuid
  userId: text("user_id").notNull(), // owner (installer)
  title: text("title").notNull(),
  description: text("description"),
  dueAt: integer("due_at", { mode: "timestamp_ms" }),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  relatedOrderId: text("related_order_id"), // optional link to an order assigned to installer
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type InstallerPrivateTask = typeof installerPrivateTasks.$inferSelect;

// Installer private notes (personal notes; optional link to an order)
export const installerPrivateNotes = sqliteTable("installer_private_notes", {
  id: text("id").primaryKey(), // uuid
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  relatedOrderId: text("related_order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type InstallerPrivateNote = typeof installerPrivateNotes.$inferSelect;

// Installer private preferences (e.g., pinned order)
export const installerPrivatePrefs = sqliteTable("installer_private_prefs", {
  userId: text("user_id").primaryKey(),
  pinnedOrderId: text("pinned_order_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type InstallerPrivatePrefs = typeof installerPrivatePrefs.$inferSelect;

// Checklisty zleceń (pojedyncze pozycje)
export const orderChecklistItems = sqliteTable(
  "order_checklist_items",
  {
    id: text("id").primaryKey(), // uuid
    orderId: text("order_id").notNull(),
    kind: text("kind").notNull(), // 'delivery' | 'installation'
    key: text("key").notNull(), // np. 'proforma', 'measurement', 'final_invoice'
    label: text("label"), // opcjonalnie (UI korzysta z i18n dla spójności)
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    doneAt: integer("done_at", { mode: "timestamp_ms" }),
    doneBy: text("done_by"), // users.id
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    idxOrder: index("order_checklist_order_id_idx").on(table.orderId),
    uniqPerOrder: uniqueIndex("order_checklist_order_key_unique").on(
      table.orderId,
      table.key,
    ),
  }),
);

export type OrderChecklistItem = typeof orderChecklistItems.$inferSelect;

// Order attachments (files in R2)
export const orderAttachments = sqliteTable(
  "order_attachments",
  {
    id: text("id").primaryKey(), // uuid
    orderId: text("order_id").notNull(),
    category: text("category").notNull(), // invoices|installs|contracts|protocols|other
    title: text("title"), // opcjonalny tytuł (na razie niewykorzystywany)
    version: integer("version").notNull().default(1),
    mime: text("mime"),
    size: integer("size"), // bytes
    key: text("key").notNull(), // R2 key
    publicUrl: text("public_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    idxOrder: index("order_attachments_order_id_idx").on(table.orderId),
    idxOrderCategory: index("order_attachments_order_category_idx").on(
      table.orderId,
      table.category,
    ),
  }),
);

export type OrderAttachment = typeof orderAttachments.$inferSelect;

// App-wide settings (key-value)
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type AppSetting = typeof appSettings.$inferSelect;

// Public client invites (Phase 1 – self-service link)
export const clientInvites = sqliteTable(
  "client_invites",
  {
    id: text("id").primaryKey(), // uuid
    token: text("token").notNull(), // random URL-safe token
    purpose: text("purpose").notNull().default("new_client"), // for future extension
    allowedFieldsJson: text("allowed_fields_json").notNull().default('["name","phone","email","source"]'), // JSON array of allowed field keys
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    resultClientId: text("result_client_id"), // clients.id after successful submission
    createdBy: text("created_by"), // user email (admin)
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    uniqToken: uniqueIndex("client_invites_token_unique").on(table.token),
    idxExpiry: index("client_invites_expires_idx").on(table.expiresAt),
    idxUsed: index("client_invites_used_idx").on(table.usedAt),
  }),
);

export type ClientInvite = typeof clientInvites.$inferSelect;
