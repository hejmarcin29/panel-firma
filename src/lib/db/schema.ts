import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const userRoles = ['owner', 'operator'] as const;
export const orderSources = ['woocommerce', 'manual'] as const;
export const orderTypes = ['production', 'sample'] as const;
export const orderStatuses = [
	'order.received',
	'order.pending_proforma',
	'order.proforma_issued',
	'order.awaiting_payment',
	'order.paid',
	'order.advance_invoice',
	'order.forwarded_to_supplier',
	'order.fulfillment_confirmed',
	'order.final_invoice',
	'order.closed',
] as const;

export const documentTypes = ['proforma', 'advance_invoice', 'final_invoice'] as const;
export const documentStatuses = ['draft', 'issued', 'cancelled', 'voided', 'corrected'] as const;

export const paymentStatuses = ['pending', 'matched', 'mismatch', 'refunded'] as const;
export const paymentMatchedBy = ['auto', 'manual'] as const;

export const supplierRequestStatuses = ['generated', 'sent', 'acknowledged', 'fulfilled', 'cancelled'] as const;

export const notificationChannels = ['email'] as const;
export const notificationStatuses = ['pending', 'sent', 'failed'] as const;

export const integrationNames = ['woocommerce', 'alior', 'email'] as const;
export const integrationLogLevels = ['info', 'warning', 'error'] as const;

export const supplierMessageDirections = ['sent', 'received'] as const;
export const supplierMessageMediums = ['email', 'phone', 'note'] as const;

export const mailFolderKinds = ['inbox', 'sent', 'drafts', 'spam', 'trash', 'archive', 'custom'] as const;
export const mailAccountStatuses = ['disabled', 'connected', 'disconnected', 'error'] as const;
export const montageStatuses = ['lead', 'before_measurement', 'before_first_payment', 'before_installation', 'before_final_invoice', 'completed'] as const;

export type UserRole = (typeof userRoles)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type OrderSource = (typeof orderSources)[number];
export type OrderType = (typeof orderTypes)[number];
export type DocumentType = (typeof documentTypes)[number];
export type DocumentStatus = (typeof documentStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type SupplierRequestStatus = (typeof supplierRequestStatuses)[number];
export type NotificationStatus = (typeof notificationStatuses)[number];
export type SupplierMessageDirection = (typeof supplierMessageDirections)[number];
export type SupplierMessageMedium = (typeof supplierMessageMediums)[number];
export type MailFolderKind = (typeof mailFolderKinds)[number];
export type MailAccountStatus = (typeof mailAccountStatuses)[number];
export type MontageStatus = string;
export type MontageMaterialStatus = 'none' | 'ordered' | 'in_stock' | 'delivered';
export type MontageInstallerStatus = 'none' | 'informed' | 'confirmed';

export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		name: text('name'),
		role: text('role').$type<UserRole>().notNull().default('operator'),
		dashboardConfig: text('dashboard_config', { mode: 'json' }),
		mobileMenuConfig: text('mobile_menu_config', { mode: 'json' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		emailIdx: uniqueIndex('users_email_idx').on(table.email),
	})
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull().unique(),
		expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		expiresIdx: index('sessions_expires_at_idx').on(table.expiresAt),
	})
);

export const customers = sqliteTable(
	'customers',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		taxId: text('tax_id'),
		billingStreet: text('billing_street'),
		billingCity: text('billing_city'),
		billingPostalCode: text('billing_postal_code'),
		billingCountry: text('billing_country'),
		shippingStreet: text('shipping_street'),
		shippingCity: text('shipping_city'),
		shippingPostalCode: text('shipping_postal_code'),
		shippingCountry: text('shipping_country'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		emailIdx: uniqueIndex('customers_email_idx').on(table.email),
		taxIdx: uniqueIndex('customers_tax_id_idx').on(table.taxId),
	})
);

export const orders = sqliteTable(
	'orders',
	{
		id: text('id').primaryKey(),
		source: text('source').$type<OrderSource>().notNull(),
		sourceOrderId: text('source_order_id'),
		status: text('status').$type<OrderStatus>().notNull(),
		customerId: text('customer_id').references(() => customers.id, {
			onDelete: 'set null',
		}),
		// monetary values stored in minor units (e.g. grosze)
		totalNet: integer('total_net', { mode: 'number' }).notNull(),
		totalGross: integer('total_gross', { mode: 'number' }).notNull(),
		currency: text('currency').notNull(),
		expectedShipDate: integer('expected_ship_date', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		statusIdx: index('orders_status_idx').on(table.status),
		sourceIdx: index('orders_source_idx').on(table.source, table.sourceOrderId),
		createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
	})
);

export const orderItems = sqliteTable(
	'order_items',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		sku: text('sku'),
		name: text('name').notNull(),
		quantity: integer('quantity').notNull(),
		unitPrice: integer('unit_price', { mode: 'number' }).notNull(),
		taxRate: integer('tax_rate', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		orderIdx: index('order_items_order_id_idx').on(table.orderId),
	})
);

export const documents = sqliteTable(
	'documents',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		type: text('type').$type<DocumentType>().notNull(),
		status: text('status').$type<DocumentStatus>().notNull(),
		number: text('number'),
		issueDate: integer('issue_date', { mode: 'timestamp_ms' }),
		pdfUrl: text('pdf_url'),
		grossAmount: integer('gross_amount', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		typeIdx: index('documents_type_idx').on(table.type),
		statusIdx: index('documents_status_idx').on(table.status),
	})
);

export const documentEvents = sqliteTable(
	'document_events',
	{
		id: text('id').primaryKey(),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.id, { onDelete: 'cascade' }),
		status: text('status').$type<DocumentStatus>().notNull(),
		actorId: text('actor_id'),
		note: text('note'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		documentIdx: index('document_events_document_id_idx').on(table.documentId),
	})
);

export const payments = sqliteTable(
	'payments',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		status: text('status').$type<PaymentStatus>().notNull(),
		amount: integer('amount', { mode: 'number' }).notNull(),
		currency: text('currency').notNull(),
		paymentDate: integer('payment_date', { mode: 'timestamp_ms' }),
		bankOperationId: text('bank_operation_id').unique(),
		rawReference: text('raw_reference'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		statusIdx: index('payments_status_idx').on(table.status),
		paymentDateIdx: index('payments_payment_date_idx').on(table.paymentDate),
	})
);

export const paymentMatches = sqliteTable(
	'payment_matches',
	{
		id: text('id').primaryKey(),
		paymentId: text('payment_id')
			.notNull()
			.references(() => payments.id, { onDelete: 'cascade' }),
		confidenceScore: integer('confidence_score'),
		matchedBy: text('matched_by').$type<(typeof paymentMatchedBy)[number]>().notNull(),
		notes: text('notes'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	}
);

export const supplierRequests = sqliteTable(
	'supplier_requests',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		status: text('status').$type<SupplierRequestStatus>().notNull(),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		responseReceivedAt: integer('response_received_at', { mode: 'timestamp_ms' }),
		carrier: text('carrier'),
		trackingNumber: text('tracking_number'),
		payload: text('payload'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		statusIdx: index('supplier_requests_status_idx').on(table.status),
	})
);

export const supplierMessages = sqliteTable(
	'supplier_messages',
	{
		id: text('id').primaryKey(),
		supplierRequestId: text('supplier_request_id')
			.notNull()
			.references(() => supplierRequests.id, { onDelete: 'cascade' }),
		direction: text('direction').$type<SupplierMessageDirection>().notNull(),
		medium: text('medium').$type<SupplierMessageMedium>().notNull(),
		subject: text('subject'),
		body: text('body'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		supplierRequestIdx: index('supplier_messages_request_idx').on(table.supplierRequestId),
	})
);

export const notifications = sqliteTable(
	'notifications',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
		channel: text('channel').$type<(typeof notificationChannels)[number]>().notNull(),
		templateCode: text('template_code').notNull(),
		recipient: text('recipient').notNull(),
		status: text('status').$type<NotificationStatus>().notNull(),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		providerMessageId: text('provider_message_id'),
		error: text('error'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		orderIdx: index('notifications_order_id_idx').on(table.orderId),
		templateIdx: index('notifications_template_code_idx').on(table.templateCode),
	})
);

export const integrationLogs = sqliteTable(
	'integration_logs',
	{
		id: text('id').primaryKey(),
		integration: text('integration')
			.$type<typeof integrationNames[number]>()
			.notNull(),
		level: text('level')
			.$type<typeof integrationLogLevels[number]>()
			.notNull(),
		message: text('message').notNull(),
		meta: text('meta'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	}
);

export const systemLogs = sqliteTable(
	'system_logs',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(),
		details: text('details'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		userIdIdx: index('system_logs_user_id_idx').on(table.userId),
		createdAtIdx: index('system_logs_created_at_idx').on(table.createdAt),
	})
);

export const appSettings = sqliteTable(
	'app_settings',
	{
		key: text('key').primaryKey(),
		value: text('value').notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
	},
	(table) => ({
		updatedAtIdx: index('app_settings_updated_at_idx').on(table.updatedAt),
	})
);

export const montages = sqliteTable(
	'montages',
	{
		id: text('id').primaryKey(),
		clientName: text('client_name').notNull(),
		contactPhone: text('contact_phone'),
		contactEmail: text('contact_email'),
		address: text('address'),
		billingAddress: text('billing_address'),
		installationAddress: text('installation_address'),
		billingCity: text('billing_city'),
		installationCity: text('installation_city'),
		billingPostalCode: text('billing_postal_code'),
		installationPostalCode: text('installation_postal_code'),
		isCompany: integer('is_company', { mode: 'boolean' }).notNull().default(false),
		companyName: text('company_name'),
		nip: text('nip'),
		scheduledInstallationAt: integer('scheduled_installation_at', { mode: 'timestamp_ms' }),
		scheduledInstallationEndAt: integer('scheduled_installation_end_at', { mode: 'timestamp_ms' }),
		materialDetails: text('material_details'),
		measurementDetails: text('measurement_details'),
		floorArea: integer('floor_area', { mode: 'number' }),
		floorDetails: text('floor_details'),
		skirtingLength: integer('skirting_length', { mode: 'number' }),
		skirtingDetails: text('skirting_details'),
		panelType: text('panel_type'),
		additionalInfo: text('additional_info'),
		forecastedInstallationDate: integer('forecasted_installation_date', { mode: 'timestamp_ms' }),
		status: text('status').$type<MontageStatus>().notNull().default('lead'),
		displayId: text('display_id'),
		materialStatus: text('material_status').$type<MontageMaterialStatus>().notNull().default('none'),
		installerStatus: text('installer_status').$type<MontageInstallerStatus>().notNull().default('none'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		statusIdx: index('montages_status_idx').on(table.status),
		updatedIdx: index('montages_updated_at_idx').on(table.updatedAt),
		displayIdIdx: uniqueIndex('montages_display_id_idx').on(table.displayId),
	})
);

export const montageNotes = sqliteTable(
	'montage_notes',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		montageIdx: index('montage_notes_montage_id_idx').on(table.montageId),
		createdAtIdx: index('montage_notes_created_at_idx').on(table.createdAt),
	})
);

export const montageAttachments = sqliteTable(
	'montage_attachments',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		noteId: text('note_id').references(() => montageNotes.id, {
			onDelete: 'set null',
		}),
		taskId: text('task_id').references(() => montageTasks.id, {
			onDelete: 'set null',
		}),
		title: text('title'),
		url: text('url').notNull(),
		uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		montageIdx: index('montage_attachments_montage_id_idx').on(table.montageId),
		noteIdx: index('montage_attachments_note_id_idx').on(table.noteId),
		createdAtIdx: index('montage_attachments_created_at_idx').on(table.createdAt),
	})
);

export const montageChecklistItems = sqliteTable(
	'montage_checklist_items',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		templateId: text('template_id').notNull(),
		label: text('label').notNull(),
		allowAttachment: integer('allow_attachment', { mode: 'boolean' })
			.notNull()
			.default(false),
		attachmentId: text('attachment_id').references(() => montageAttachments.id, {
			onDelete: 'set null',
		}),
		completed: integer('completed', { mode: 'boolean' })
			.notNull()
			.default(false),
		orderIndex: integer('order_index', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		montageIdx: index('montage_checklist_items_montage_id_idx').on(table.montageId),
		completedIdx: index('montage_checklist_items_completed_idx').on(table.completed),
	})
);

export const montageTasks = sqliteTable(
	'montage_tasks',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
		orderIndex: integer('order_index'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		montageIdx: index('montage_tasks_montage_id_idx').on(table.montageId),
		completedIdx: index('montage_tasks_completed_idx').on(table.completed),
	})
);

export const montagesRelations = relations(montages, ({ many }) => ({
	notes: many(montageNotes),
	attachments: many(montageAttachments),
	checklistItems: many(montageChecklistItems),
	tasks: many(montageTasks),
}));

export const montageNotesRelations = relations(montageNotes, ({ one, many }) => ({
	montage: one(montages, {
		fields: [montageNotes.montageId],
		references: [montages.id],
	}),
	author: one(users, {
		fields: [montageNotes.createdBy],
		references: [users.id],
	}),
	attachments: many(montageAttachments),
}));

export const montageAttachmentsRelations = relations(montageAttachments, ({ one }) => ({
	montage: one(montages, {
		fields: [montageAttachments.montageId],
		references: [montages.id],
	}),
	uploader: one(users, {
		fields: [montageAttachments.uploadedBy],
		references: [users.id],
	}),
	note: one(montageNotes, {
		fields: [montageAttachments.noteId],
		references: [montageNotes.id],
	}),
	task: one(montageTasks, {
		fields: [montageAttachments.taskId],
		references: [montageTasks.id],
	}),
}));

export const montageChecklistItemsRelations = relations(montageChecklistItems, ({ one }) => ({
	montage: one(montages, {
		fields: [montageChecklistItems.montageId],
		references: [montages.id],
	}),
	attachment: one(montageAttachments, {
		fields: [montageChecklistItems.attachmentId],
		references: [montageAttachments.id],
	}),
}));

export const montageTasksRelations = relations(montageTasks, ({ one, many }) => ({
	montage: one(montages, {
		fields: [montageTasks.montageId],
		references: [montages.id],
	}),
	attachments: many(montageAttachments),
}));

export const manualOrders = sqliteTable(
	'manual_orders',
	{
		id: text('id').primaryKey(),
		reference: text('reference').notNull(),
		status: text('status').notNull(),
		channel: text('channel').notNull(),
		notes: text('notes'),
		timelineTaskOverrides: text('timeline_task_overrides'),
		currency: text('currency').notNull().default('PLN'),
		source: text('source').$type<OrderSource>().notNull().default('manual'),
		type: text('type').$type<OrderType>().notNull().default('production'),
		sourceOrderId: text('source_order_id'),
		requiresReview: integer('requires_review', { mode: 'boolean' })
			.notNull()
			.default(false),
		totalNet: integer('total_net', { mode: 'number' }).notNull(),
		totalGross: integer('total_gross', { mode: 'number' }).notNull(),
		billingName: text('billing_name').notNull(),
		billingStreet: text('billing_street').notNull(),
		billingPostalCode: text('billing_postal_code').notNull(),
		billingCity: text('billing_city').notNull(),
		billingPhone: text('billing_phone').notNull(),
		billingEmail: text('billing_email').notNull(),
		shippingSameAsBilling: integer('shipping_same_as_billing', { mode: 'boolean' })
			.notNull()
			.default(false),
		shippingName: text('shipping_name'),
		shippingStreet: text('shipping_street'),
		shippingPostalCode: text('shipping_postal_code'),
		shippingCity: text('shipping_city'),
		shippingPhone: text('shipping_phone'),
		shippingEmail: text('shipping_email'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		referenceIdx: uniqueIndex('manual_orders_reference_idx').on(table.reference),
		createdAtIdx: index('manual_orders_created_at_idx').on(table.createdAt),
		requiresReviewIdx: index('manual_orders_requires_review_idx').on(table.requiresReview),
		typeIdx: index('manual_orders_type_idx').on(table.type),
	})
);

export const orderAttachments = sqliteTable(
	'order_attachments',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => manualOrders.id, { onDelete: 'cascade' }),
		title: text('title'),
		url: text('url').notNull(),
		uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		orderIdx: index('order_attachments_order_id_idx').on(table.orderId),
		createdAtIdx: index('order_attachments_created_at_idx').on(table.createdAt),
	})
);

export const manualOrderItems = sqliteTable(
	'manual_order_items',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => manualOrders.id, { onDelete: 'cascade' }),
		product: text('product').notNull(),
		quantity: integer('quantity', { mode: 'number' }).notNull(),
		unitPrice: integer('unit_price', { mode: 'number' }).notNull(),
		vatRate: integer('vat_rate', { mode: 'number' }).notNull(),
		unitPricePerSquareMeter: integer('unit_price_per_square_meter', { mode: 'number' }),
		totalNet: integer('total_net', { mode: 'number' }).notNull(),
		totalGross: integer('total_gross', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		orderIdx: index('manual_order_items_order_id_idx').on(table.orderId),
	})
);

export const mailAccounts = sqliteTable(
	'mail_accounts',
	{
		id: text('id').primaryKey(),
		displayName: text('display_name').notNull(),
		email: text('email').notNull(),
		provider: text('provider'),
		status: text('status').$type<MailAccountStatus>().notNull().default('disabled'),
		lastSyncAt: integer('last_sync_at', { mode: 'timestamp_ms' }),
		nextSyncAt: integer('next_sync_at', { mode: 'timestamp_ms' }),
		imapHost: text('imap_host'),
		imapPort: integer('imap_port', { mode: 'number' }),
		imapSecure: integer('imap_secure', { mode: 'boolean' }).notNull().default(true),
		smtpHost: text('smtp_host'),
		smtpPort: integer('smtp_port', { mode: 'number' }),
		smtpSecure: integer('smtp_secure', { mode: 'boolean' }).notNull().default(true),
		username: text('username').notNull(),
		passwordSecret: text('password_secret'),
		signature: text('signature'),
		error: text('error'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		emailIdx: uniqueIndex('mail_accounts_email_idx').on(table.email),
		statusIdx: index('mail_accounts_status_idx').on(table.status),
	})
);

export const mailFolders = sqliteTable(
	'mail_folders',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => mailAccounts.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		kind: text('kind').$type<MailFolderKind>().notNull().default('custom'),
		remoteId: text('remote_id'),
		path: text('path'),
		sortOrder: integer('sort_order', { mode: 'number' }).default(0),
		unreadCount: integer('unread_count', { mode: 'number' }).default(0),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		accountIdx: index('mail_folders_account_id_idx').on(table.accountId),
		remoteIdx: index('mail_folders_remote_id_idx').on(table.accountId, table.remoteId),
		kindIdx: index('mail_folders_kind_idx').on(table.kind),
	})
);

export const mailMessages = sqliteTable(
	'mail_messages',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => mailAccounts.id, { onDelete: 'cascade' }),
		folderId: text('folder_id')
			.notNull()
			.references(() => mailFolders.id, { onDelete: 'cascade' }),
		subject: text('subject'),
		fromAddress: text('from_address'),
		fromName: text('from_name'),
		toRecipients: text('to_recipients'),
		ccRecipients: text('cc_recipients'),
		bccRecipients: text('bcc_recipients'),
		replyTo: text('reply_to'),
		snippet: text('snippet'),
		textBody: text('text_body'),
		htmlBody: text('html_body'),
		messageId: text('message_id'),
		threadId: text('thread_id'),
		externalId: text('external_id'),
		receivedAt: integer('received_at', { mode: 'timestamp_ms' }),
		internalDate: integer('internal_date', { mode: 'timestamp_ms' }),
		isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
		isStarred: integer('is_starred', { mode: 'boolean' }).notNull().default(false),
		hasAttachments: integer('has_attachments', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		accountIdx: index('mail_messages_account_id_idx').on(table.accountId),
		folderIdx: index('mail_messages_folder_id_idx').on(table.folderId),
		receivedIdx: index('mail_messages_received_at_idx').on(table.receivedAt),
		messageIdIdx: uniqueIndex('mail_messages_message_id_idx').on(table.accountId, table.messageId),
	})
);

export const manualOrdersRelations = relations(manualOrders, ({ many }) => ({
	items: many(manualOrderItems),
	attachments: many(orderAttachments),
}));

export const manualOrderItemsRelations = relations(manualOrderItems, ({ one }) => ({
	order: one(manualOrders, {
		fields: [manualOrderItems.orderId],
		references: [manualOrders.id],
	}),
}));

export const orderAttachmentsRelations = relations(orderAttachments, ({ one }) => ({
	order: one(manualOrders, {
		fields: [orderAttachments.orderId],
		references: [manualOrders.id],
	}),
	uploader: one(users, {
		fields: [orderAttachments.uploadedBy],
		references: [users.id],
	}),
}));

export const mailAccountsRelations = relations(mailAccounts, ({ many }) => ({
	folders: many(mailFolders),
	messages: many(mailMessages),
}));

export const mailFoldersRelations = relations(mailFolders, ({ one, many }) => ({
	account: one(mailAccounts, {
		fields: [mailFolders.accountId],
		references: [mailAccounts.id],
	}),
	messages: many(mailMessages),
}));

export const mailMessagesRelations = relations(mailMessages, ({ one }) => ({
	account: one(mailAccounts, {
		fields: [mailMessages.accountId],
		references: [mailAccounts.id],
	}),
	folder: one(mailFolders, {
		fields: [mailMessages.folderId],
		references: [mailFolders.id],
	}),
}));

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
	user: one(users, {
		fields: [systemLogs.userId],
		references: [users.id],
	}),
}));

export const boardColumns = sqliteTable(
	'board_columns',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		orderIndex: integer('order_index', { mode: 'number' }).notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		orderIdx: index('board_columns_order_idx').on(table.orderIndex),
	})
);

export const boardTasks = sqliteTable(
	'board_tasks',
	{
		id: text('id').primaryKey(),
		columnId: text('column_id')
			.notNull()
			.references(() => boardColumns.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		description: text('description'),
		completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
		orderIndex: integer('order_index', { mode: 'number' }).notNull().default(0),
		dueDate: integer('due_date', { mode: 'timestamp_ms' }),
		reminderAt: integer('reminder_at', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		columnIdx: index('board_tasks_column_id_idx').on(table.columnId),
		orderIdx: index('board_tasks_order_idx').on(table.orderIndex),
	})
);

export const taskAttachments = sqliteTable(
	'task_attachments',
	{
		id: text('id').primaryKey(),
		taskId: text('task_id')
			.notNull()
			.references(() => boardTasks.id, { onDelete: 'cascade' }),
		fileUrl: text('file_url').notNull(),
		fileName: text('file_name').notNull(),
		fileType: text('file_type'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(strftime('%s','now') * 1000)`),
	},
	(table) => ({
		taskIdx: index('task_attachments_task_id_idx').on(table.taskId),
	})
);

export const boardColumnsRelations = relations(boardColumns, ({ many }) => ({
	tasks: many(boardTasks),
}));

export const boardTasksRelations = relations(boardTasks, ({ one, many }) => ({
	column: one(boardColumns, {
		fields: [boardTasks.columnId],
		references: [boardColumns.id],
	}),
	attachments: many(taskAttachments),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
	task: one(boardTasks, {
		fields: [taskAttachments.taskId],
		references: [boardTasks.id],
	}),
}));

