import {
	index,
	integer,
	pgTable,
	text,
	uniqueIndex,
	real,
    boolean,
    timestamp,
    json,
    doublePrecision,
    decimal
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoles = ['admin', 'installer', 'architect', 'partner'] as const;
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
export const montageSampleStatuses = ['none', 'to_send', 'sent', 'delivered', 'returned'] as const;
export const logisticsStatuses = ['pending', 'ready', 'loaded', 'delivered'] as const;
export const customerSources = ['internet', 'social_media', 'recommendation', 'architect', 'event', 'drive_by', 'phone', 'other'] as const;

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

export const montageStatuses = [
    // 1. LEJKI
    'new_lead',
    'contact_attempt',
    'contact_established',
    'measurement_scheduled',
    // 2. WYCENA
    'measurement_done',
    'quote_in_progress',
    'quote_sent',
    'quote_accepted',
    // 3. FORMALNOŚCI
    'contract_signed',
    'waiting_for_deposit',
    'deposit_paid',
    // 4. LOGISTYKA
    'materials_ordered',
    'materials_pickup_ready',
    'installation_scheduled',
    'materials_delivered',
    // 5. REALIZACJA
    'installation_in_progress',
    'protocol_signed',
    // 6. FINISZ
    'final_invoice_issued',
    'final_settlement',
    'completed',
    // 7. STANY SPECJALNE
    'on_hold',
    'rejected',
    'complaint'
] as const;

export type MontageStatus = (typeof montageStatuses)[number];
export type MontageSampleStatus = (typeof montageSampleStatuses)[number];
export type LogisticsStatus = (typeof logisticsStatuses)[number];
export type CustomerSource = (typeof customerSources)[number];
export type MontageMaterialStatus = 'none' | 'ordered' | 'in_stock' | 'delivered';
export type MontageMaterialClaimType = 'installer_pickup' | 'company_delivery' | 'courier' | 'client_pickup' | 'client_supply';
export type MontageInstallerStatus = 'none' | 'informed' | 'confirmed';

export type InstallerProfile = {
	workScope?: string;
	operationArea?: string;
    phone?: string;
    carPlate?: string;
    nip?: string;
    bankAccount?: string;
    rates?: {
        classicClick?: number;
        classicGlue?: number;
        herringboneClick?: number;
        herringboneGlue?: number;
    };
	pricing?: {
		serviceName: string;
		price: number;
		unit: string;
	}[];
};

export type ArchitectProfile = {
	companyName?: string;
	nip?: string;
	bankAccount?: string;
	commissionRate?: number; // PLN per m2
    assignedProductIds?: (number | string)[]; // Legacy or for specific manual adds
    assignedCategories?: { id: number | string; name: string }[];
    excludedProductIds?: (number | string)[]; // IDs of products to hide even if category is assigned
};

export type PartnerProfile = {
    companyName?: string;
    nip?: string;
    bankAccount?: string;
    commissionRate?: number; // PLN per m2
    termsAcceptedAt?: string; // ISO date string
    termsVersion?: string;
};

export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		name: text('name'),
		roles: json('roles').$type<UserRole[]>().notNull().default(['admin']),
		isActive: boolean('is_active').notNull().default(true),
		dashboardConfig: json('dashboard_config'),
		mobileMenuConfig: json('mobile_menu_config'),
		installerProfile: json('installer_profile').$type<InstallerProfile>(),
		architectProfile: json('architect_profile').$type<ArchitectProfile>(),
        partnerProfile: json('partner_profile').$type<PartnerProfile>(),
        referralToken: text('referral_token').unique(),
        googleRefreshToken: text('google_refresh_token'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		emailIdx: uniqueIndex('users_email_idx').on(table.email),
        referralTokenIdx: uniqueIndex('users_referral_token_idx').on(table.referralToken),
	})
);

export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull().unique(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
		originalUserId: text('original_user_id').references(() => users.id, { onDelete: 'set null' }),
	},
	(table) => ({
		expiresIdx: index('sessions_expires_at_idx').on(table.expiresAt),
	})
);

export const customers = pgTable(
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
		source: text('source').$type<CustomerSource>().default('other'),
		architectId: text('architect_id').references(() => users.id, { onDelete: 'set null' }),
        // Referral Program Fields (Magic Link Token)
        referralToken: text('referral_token').unique(),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		emailIdx: uniqueIndex('customers_email_idx').on(table.email),
		taxIdx: uniqueIndex('customers_tax_id_idx').on(table.taxId),
        referralTokenIdx: uniqueIndex('customers_referral_token_idx').on(table.referralToken),
    })
);

export const customersRelations = relations(customers, ({ one, many }) => ({
    orders: many(orders),
    montages: many(montages),
    architect: one(users, {
        fields: [customers.architectId],
        references: [users.id],
    }),
}));

/*
export const payoutRequests = pgTable(
    'payout_requests',
    {
        id: text('id').primaryKey(),
        customerId: text('customer_id')
            .notNull()
            .references(() => customers.id, { onDelete: 'cascade' }),
        amount: integer('amount').notNull(), // in grosz
        status: text('status').$type<'pending' | 'completed' | 'rejected'>().notNull().default('pending'),
        rewardType: text('reward_type').notNull(), // 'allegro', 'ikea', etc.
        note: text('note'), // Admin note (e.g. voucher code)
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        completedAt: timestamp('completed_at'),
    },
    (table) => ({
        customerIdx: index('payout_requests_customer_id_idx').on(table.customerId),
        statusIdx: index('payout_requests_status_idx').on(table.status),
    })
);

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
    customer: one(customers, {
        fields: [payoutRequests.customerId],
        references: [customers.id],
    }),
}));

export const referralCommissions = pgTable(
    'referral_commissions',
    {
        id: text('id').primaryKey(),
        montageId: text('montage_id')
            .notNull()
            .references(() => montages.id, { onDelete: 'cascade' }),
        beneficiaryCustomerId: text('beneficiary_customer_id')
            .notNull()
            .references(() => customers.id, { onDelete: 'cascade' }),
        amount: integer('amount').notNull(), // in grosz
        floorArea: real('floor_area').notNull(),
        ratePerSqm: integer('rate_per_sqm').notNull().default(1000), // 10.00 PLN
        status: text('status').$type<'pending' | 'approved' | 'cancelled'>().notNull().default('pending'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        montageIdx: index('referral_commissions_montage_id_idx').on(table.montageId),
        beneficiaryIdx: index('referral_commissions_beneficiary_id_idx').on(table.beneficiaryCustomerId),
    })
);

export const referralCommissionsRelations = relations(referralCommissions, ({ one }) => ({
    montage: one(montages, {
        fields: [referralCommissions.montageId],
        references: [montages.id],
    }),
    beneficiary: one(customers, {
        fields: [referralCommissions.beneficiaryCustomerId],
        references: [customers.id],
    }),
}));
*/

export const orders = pgTable(
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
		totalNet: integer('total_net').notNull(),
		totalGross: integer('total_gross').notNull(),
		currency: text('currency').notNull(),
		expectedShipDate: timestamp('expected_ship_date'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		statusIdx: index('orders_status_idx').on(table.status),
		sourceIdx: index('orders_source_idx').on(table.source, table.sourceOrderId),
		createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
	})
);

export const orderItems = pgTable(
	'order_items',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		sku: text('sku'),
		name: text('name').notNull(),
		quantity: integer('quantity').notNull(),
		unitPrice: integer('unit_price').notNull(),
		taxRate: integer('tax_rate').notNull(),
		createdAt: timestamp('created_at')
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		orderIdx: index('order_items_order_id_idx').on(table.orderId),
	})
);

export const documents = pgTable(
	'documents',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		type: text('type').$type<DocumentType>().notNull(),
		status: text('status').$type<DocumentStatus>().notNull(),
		number: text('number'),
		issueDate: timestamp('issue_date'),
		pdfUrl: text('pdf_url'),
		grossAmount: integer('gross_amount'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		typeIdx: index('documents_type_idx').on(table.type),
		statusIdx: index('documents_status_idx').on(table.status),
	})
);

export const documentEvents = pgTable(
	'document_events',
	{
		id: text('id').primaryKey(),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.id, { onDelete: 'cascade' }),
		status: text('status').$type<DocumentStatus>().notNull(),
		actorId: text('actor_id'),
		note: text('note'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		documentIdx: index('document_events_document_id_idx').on(table.documentId),
	})
);

export const payments = pgTable(
	'payments',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		status: text('status').$type<PaymentStatus>().notNull(),
		amount: integer('amount').notNull(),
		currency: text('currency').notNull(),
		paymentDate: timestamp('payment_date'),
		bankOperationId: text('bank_operation_id').unique(),
		rawReference: text('raw_reference'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		statusIdx: index('payments_status_idx').on(table.status),
		paymentDateIdx: index('payments_payment_date_idx').on(table.paymentDate),
	})
);

export const paymentMatches = pgTable(
	'payment_matches',
	{
		id: text('id').primaryKey(),
		paymentId: text('payment_id')
			.notNull()
			.references(() => payments.id, { onDelete: 'cascade' }),
		confidenceScore: integer('confidence_score'),
		matchedBy: text('matched_by').$type<(typeof paymentMatchedBy)[number]>().notNull(),
		notes: text('notes'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	}
);

export const supplierRequests = pgTable(
	'supplier_requests',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		status: text('status').$type<SupplierRequestStatus>().notNull(),
		sentAt: timestamp('sent_at'),
		responseReceivedAt: timestamp('response_received_at'),
		carrier: text('carrier'),
		trackingNumber: text('tracking_number'),
		payload: text('payload'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		statusIdx: index('supplier_requests_status_idx').on(table.status),
	})
);

export const supplierMessages = pgTable(
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
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		supplierRequestIdx: index('supplier_messages_request_idx').on(table.supplierRequestId),
	})
);

export const notifications = pgTable(
	'notifications',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
		channel: text('channel').$type<(typeof notificationChannels)[number]>().notNull(),
		templateCode: text('template_code').notNull(),
		recipient: text('recipient').notNull(),
		status: text('status').$type<NotificationStatus>().notNull(),
		sentAt: timestamp('sent_at'),
		providerMessageId: text('provider_message_id'),
		error: text('error'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		orderIdx: index('notifications_order_id_idx').on(table.orderId),
		templateIdx: index('notifications_template_code_idx').on(table.templateCode),
	})
);

export const integrationLogs = pgTable(
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
		createdAt: timestamp('created_at').notNull().defaultNow(),
	}
);

export const systemLogs = pgTable(
	'system_logs',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(),
		details: text('details'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		userIdIdx: index('system_logs_user_id_idx').on(table.userId),
		createdAtIdx: index('system_logs_created_at_idx').on(table.createdAt),
	})
);

export const appSettings = pgTable(
	'app_settings',
	{
		key: text('key').primaryKey(),
		value: text('value').notNull(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
		updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
	},
	(table) => ({
		updatedAtIdx: index('app_settings_updated_at_idx').on(table.updatedAt),
	})
);

import type { TechnicalAuditData, MaterialLogData } from '@/app/dashboard/crm/montaze/technical-data';

export const montages = pgTable(
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
		isCompany: boolean('is_company').notNull().default(false),
        isHousingVat: boolean('is_housing_vat').default(false),
		companyName: text('company_name'),
		nip: text('nip'),
		scheduledInstallationAt: timestamp('scheduled_installation_at', { withTimezone: true }),
		scheduledInstallationEndAt: timestamp('scheduled_installation_end_at', { withTimezone: true }),
        installationDateConfirmed: boolean('installation_date_confirmed').default(false),
        measurementDate: timestamp('measurement_date', { withTimezone: true }),
		materialDetails: text('material_details'),
		measurementDetails: text('measurement_details'),
		measurementInstallationMethod: text('measurement_installation_method').$type<'click' | 'glue'>(),
        measurementFloorPattern: text('measurement_floor_pattern').$type<'classic' | 'herringbone'>().default('classic'),
		measurementSubfloorCondition: text('measurement_subfloor_condition'),
		measurementAdditionalWorkNeeded: boolean('measurement_additional_work_needed').default(false),
		measurementAdditionalWorkDescription: text('measurement_additional_work_description'),
        measurementAdditionalMaterials: json('measurement_additional_materials').$type<{
            id: string;
            name: string;
            quantity: string;
            unit?: string;
            supplySide: 'installer' | 'company';
            estimatedCost?: number;
        }[]>(),
        measurementRooms: json('measurement_rooms').$type<{
            name: string;
            area: number;
        }[]>(),
        estimatedFloorArea: doublePrecision('estimated_floor_area'),
		floorArea: doublePrecision('floor_area'),
		floorDetails: text('floor_details'),
		panelModel: text('panel_model'),
		panelProductId: text('panel_product_id'),
		panelWaste: doublePrecision('panel_waste'),
		modelsApproved: boolean('models_approved').notNull().default(false),
		finalPanelAmount: doublePrecision('final_panel_amount'),
		materialsEditHistory: json('materials_edit_history'),
		additionalInfo: text('additional_info'),
        clientInfo: text('client_info'),
		sketchUrl: text('sketch_url'),
		forecastedInstallationDate: timestamp('forecasted_installation_date'),
		status: text('status').$type<MontageStatus>().notNull().default('new_lead'),
        sampleStatus: text('sample_status').$type<MontageSampleStatus>().default('none'),
		displayId: text('display_id'),
		materialStatus: text('material_status').$type<MontageMaterialStatus>().notNull().default('none'),
        materialClaimType: text('material_claim_type').$type<MontageMaterialClaimType>(),
		installerStatus: text('installer_status').$type<MontageInstallerStatus>().notNull().default('none'),
		installerId: text('installer_id').references(() => users.id, { onDelete: 'set null' }),
		measurerId: text('measurer_id').references(() => users.id, { onDelete: 'set null' }),
		architectId: text('architect_id').references(() => users.id, { onDelete: 'set null' }),
        partnerId: text('partner_id').references(() => users.id, { onDelete: 'set null' }),
		customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
        googleEventId: text('google_event_id'),
        
        // Protocol & Contract Fields
        contractNumber: text('contract_number'),
        contractDate: timestamp('contract_date'),
        protocolStatus: text('protocol_status').default('pending'), // 'pending' | 'signed'
        protocolData: json('protocol_data').$type<{
            isHousingVat: boolean;
            location: string;
            signedAt: string;
            notes: string;
        }>(),
        clientSignatureUrl: text('client_signature_url'),

        installerSignatureUrl: text('installer_signature_url'),

        technicalAudit: json('technical_audit').$type<TechnicalAuditData>(),
        materialLog: json('material_log').$type<MaterialLogData>(),
        
        costEstimationCompletedAt: timestamp('cost_estimation_completed_at'),
        completedAt: timestamp('completed_at'),

        // Logistics
        logisticsStatus: text('logistics_status').$type<LogisticsStatus>().default('pending'),
        logisticsNotes: text('logistics_notes'),
        logisticsUpdatedAt: timestamp('logistics_updated_at'),
        cargoChecklist: json('cargo_checklist').$type<Record<string, { picked: boolean }>>(),

		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		statusIdx: index('montages_status_idx').on(table.status),
		updatedIdx: index('montages_updated_at_idx').on(table.updatedAt),
		displayIdIdx: uniqueIndex('montages_display_id_idx').on(table.displayId),
		installerIdx: index('montages_installer_id_idx').on(table.installerId),
		measurerIdx: index('montages_measurer_id_idx').on(table.measurerId),
		architectIdx: index('montages_architect_id_idx').on(table.architectId),
        partnerIdx: index('montages_partner_id_idx').on(table.partnerId),
	})
);

export const montageNotes = pgTable(
	'montage_notes',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
        isInternal: boolean('is_internal').notNull().default(false),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		montageIdx: index('montage_notes_montage_id_idx').on(table.montageId),
		createdAtIdx: index('montage_notes_created_at_idx').on(table.createdAt),
	})
);

export const montageAttachments = pgTable(
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
		type: text('type').default('general').notNull(),
		title: text('title'),
		url: text('url').notNull(),
		uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		montageIdx: index('montage_attachments_montage_id_idx').on(table.montageId),
		noteIdx: index('montage_attachments_note_id_idx').on(table.noteId),
		createdAtIdx: index('montage_attachments_created_at_idx').on(table.createdAt),
	})
);

export const montageChecklistItems = pgTable(
	'montage_checklist_items',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		templateId: text('template_id').notNull(),
		label: text('label').notNull(),
		allowAttachment: boolean('allow_attachment')
			.notNull()
			.default(false),
		attachmentId: text('attachment_id').references(() => montageAttachments.id, {
			onDelete: 'set null',
		}),
		completed: boolean('completed')
			.notNull()
			.default(false),
		orderIndex: integer('order_index').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		montageIdx: index('montage_checklist_items_montage_id_idx').on(table.montageId),
		completedIdx: index('montage_checklist_items_completed_idx').on(table.completed),
	})
);

export const montagePayments = pgTable(
    'montage_payments',
    {
        id: text('id').primaryKey(),
        montageId: text('montage_id')
            .notNull()
            .references(() => montages.id, { onDelete: 'cascade' }),
        type: text('type', { enum: ['advance', 'final', 'other'] }).default('other').notNull(),
        name: text('name').notNull(), // "Zaliczka", "II Rata", etc.
        amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
        status: text('status', { enum: ['pending', 'paid'] }).default('pending').notNull(),
        invoiceNumber: text('invoice_number').notNull(), // The number for the transfer title
        proformaUrl: text('proforma_url'), // URL to the uploaded Proforma
        invoiceUrl: text('invoice_url'), // URL to the uploaded Final Invoice
        dueDate: timestamp('due_date'),
        paidAt: timestamp('paid_at'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        montageIdx: index('montage_payments_montage_id_idx').on(table.montageId),
        statusIdx: index('montage_payments_status_idx').on(table.status),
    })
);


export const montageTasks = pgTable(
	'montage_tasks',
	{
		id: text('id').primaryKey(),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		source: text('source').notNull().default('manual'),
		completed: boolean('completed').notNull().default(false),
		orderIndex: integer('order_index'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		montageIdx: index('montage_tasks_montage_id_idx').on(table.montageId),
		completedIdx: index('montage_tasks_completed_idx').on(table.completed),
	})
);

export const montagesRelations = relations(montages, ({ one, many }) => ({
	notes: many(montageNotes),
	attachments: many(montageAttachments),
	checklistItems: many(montageChecklistItems),
	tasks: many(montageTasks),
	commissions: many(commissions, { relationName: 'commission_montage' }),
	installer: one(users, {
		fields: [montages.installerId],
		references: [users.id],
		relationName: 'montage_installer',
	}),
	measurer: one(users, {
		fields: [montages.measurerId],
		references: [users.id],
		relationName: 'montage_measurer',
	}),
	architect: one(users, {
		fields: [montages.architectId],
		references: [users.id],
		relationName: 'montage_architect',
	}),
    partner: one(users, {
        fields: [montages.partnerId],
        references: [users.id],
        relationName: 'montage_partner',
    }),
    customer: one(customers, {
        fields: [montages.customerId],
        references: [customers.id],
    }),
    quotes: many(quotes),
    payments: many(montagePayments),
    serviceItems: many(montageServiceItems),
    settlement: one(settlements, {
        fields: [montages.id],
        references: [settlements.montageId],
    }),
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

export const montagePaymentsRelations = relations(montagePayments, ({ one }) => ({
    montage: one(montages, {
        fields: [montagePayments.montageId],
        references: [montages.id],
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

export const manualOrders = pgTable(
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
		requiresReview: boolean('requires_review')
			.notNull()
			.default(false),
		totalNet: integer('total_net').notNull(),
		totalGross: integer('total_gross').notNull(),
		billingName: text('billing_name').notNull(),
		billingStreet: text('billing_street').notNull(),
		billingPostalCode: text('billing_postal_code').notNull(),
		billingCity: text('billing_city').notNull(),
		billingPhone: text('billing_phone').notNull(),
		billingEmail: text('billing_email').notNull(),
		shippingSameAsBilling: boolean('shipping_same_as_billing')
			.notNull()
			.default(false),
		shippingName: text('shipping_name'),
		shippingStreet: text('shipping_street'),
		shippingPostalCode: text('shipping_postal_code'),
		shippingCity: text('shipping_city'),
		shippingPhone: text('shipping_phone'),
		shippingEmail: text('shipping_email'),
		paymentMethod: text('payment_method'),
		shippingMethod: text('shipping_method'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		referenceIdx: uniqueIndex('manual_orders_reference_idx').on(table.reference),
		createdAtIdx: index('manual_orders_created_at_idx').on(table.createdAt),
		requiresReviewIdx: index('manual_orders_requires_review_idx').on(table.requiresReview),
		typeIdx: index('manual_orders_type_idx').on(table.type),
	})
);

export const orderAttachments = pgTable(
	'order_attachments',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => manualOrders.id, { onDelete: 'cascade' }),
		title: text('title'),
		url: text('url').notNull(),
		uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		orderIdx: index('order_attachments_order_id_idx').on(table.orderId),
		createdAtIdx: index('order_attachments_created_at_idx').on(table.createdAt),
	})
);

export const manualOrderItems = pgTable(
	'manual_order_items',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => manualOrders.id, { onDelete: 'cascade' }),
		product: text('product').notNull(),
		quantity: integer('quantity').notNull(),
		unitPrice: integer('unit_price').notNull(),
		vatRate: integer('vat_rate').notNull(),
		unitPricePerSquareMeter: integer('unit_price_per_square_meter'),
		totalNet: integer('total_net').notNull(),
		totalGross: integer('total_gross').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		orderIdx: index('manual_order_items_order_id_idx').on(table.orderId),
	})
);

export const mailAccounts = pgTable(
	'mail_accounts',
	{
		id: text('id').primaryKey(),
		displayName: text('display_name').notNull(),
		email: text('email').notNull(),
		provider: text('provider'),
		status: text('status').$type<MailAccountStatus>().notNull().default('disabled'),
		lastSyncAt: timestamp('last_sync_at'),
		nextSyncAt: timestamp('next_sync_at'),
		imapHost: text('imap_host'),
		imapPort: integer('imap_port'),
		imapSecure: boolean('imap_secure').notNull().default(true),
		smtpHost: text('smtp_host'),
		smtpPort: integer('smtp_port'),
		smtpSecure: boolean('smtp_secure').notNull().default(true),
		username: text('username').notNull(),
		passwordSecret: text('password_secret'),
		signature: text('signature'),
		error: text('error'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		emailIdx: uniqueIndex('mail_accounts_email_idx').on(table.email),
		statusIdx: index('mail_accounts_status_idx').on(table.status),
	})
);

export const mailFolders = pgTable(
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
		sortOrder: integer('sort_order').default(0),
		unreadCount: integer('unread_count').default(0),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		accountIdx: index('mail_folders_account_id_idx').on(table.accountId),
		remoteIdx: index('mail_folders_remote_id_idx').on(table.accountId, table.remoteId),
		kindIdx: index('mail_folders_kind_idx').on(table.kind),
	})
);

export const mailMessages = pgTable(
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
		receivedAt: timestamp('received_at'),
		internalDate: timestamp('internal_date'),
		isRead: boolean('is_read').notNull().default(false),
		isStarred: boolean('is_starred').notNull().default(false),
		hasAttachments: boolean('has_attachments').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
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

export const boardColumns = pgTable(
	'board_columns',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		orderIndex: integer('order_index').notNull().default(0),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		orderIdx: index('board_columns_order_idx').on(table.orderIndex),
	})
);

export const boardTasks = pgTable(
	'board_tasks',
	{
		id: text('id').primaryKey(),
		columnId: text('column_id')
			.notNull()
			.references(() => boardColumns.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		description: text('description'),
		completed: boolean('completed').notNull().default(false),
		orderIndex: integer('order_index').notNull().default(0),
		priority: text('priority').notNull().default('normal'),
		dueDate: timestamp('due_date'),
		reminderAt: timestamp('reminder_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		columnIdx: index('board_tasks_column_id_idx').on(table.columnId),
		orderIdx: index('board_tasks_order_idx').on(table.orderIndex),
	})
);

export const taskAttachments = pgTable(
	'task_attachments',
	{
		id: text('id').primaryKey(),
		taskId: text('task_id')
			.notNull()
			.references(() => boardTasks.id, { onDelete: 'cascade' }),
		fileUrl: text('file_url').notNull(),
		fileName: text('file_name').notNull(),
		fileType: text('file_type'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
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

export const quoteStatuses = ['draft', 'sent', 'accepted', 'rejected'] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

export type QuoteItem = {
    id: string;
    productId?: string | number;
    name: string;
    quantity: number;
    unit: string;
    priceNet: number;
    vatRate: number;
    priceGross: number;
    totalNet: number;
    totalGross: number;
};

export const quotes = pgTable(
    'quotes',
    {
        id: text('id').primaryKey(),
        number: text('number'),
        montageId: text('montage_id')
            .notNull()
            .references(() => montages.id, { onDelete: 'cascade' }),
        status: text('status').$type<QuoteStatus>().notNull().default('draft'),
        items: json('items').$type<QuoteItem[]>().notNull().default([]),
        totalNet: doublePrecision('total_net').notNull().default(0),
        totalGross: doublePrecision('total_gross').notNull().default(0),
        validUntil: timestamp('valid_until'),
        notes: text('notes'),
        // Contract fields
        termsContent: text('terms_content'), // Snapshot of legal terms
        signatureData: text('signature_data'), // Base64 signature
        signedAt: timestamp('signed_at'),
        finalPdfUrl: text('final_pdf_url'),
        
        deletedAt: timestamp('deleted_at'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        montageIdx: index('quotes_montage_id_idx').on(table.montageId),
        statusIdx: index('quotes_status_idx').on(table.status),
    })
);



// Legacy products table removed


export const ordersRelations = relations(orders, ({ one, many }) => ({
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id],
	}),
	items: many(orderItems),
	documents: many(documents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
	order: one(orders, {
		fields: [documents.orderId],
		references: [orders.id],
	}),
}));

export const commissionStatuses = ['pending', 'approved', 'paid'] as const;
export type CommissionStatus = (typeof commissionStatuses)[number];

export const commissions = pgTable(
	'commissions',
	{
		id: text('id').primaryKey(),
		architectId: text('architect_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		montageId: text('montage_id')
			.notNull()
			.references(() => montages.id, { onDelete: 'cascade' }),
		amount: integer('amount').notNull(), // in minor units (grosze)
		rate: real('rate').notNull(), // PLN per m2
		area: real('area').notNull(), // m2
		status: text('status').$type<CommissionStatus>().notNull().default('pending'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
		approvedAt: timestamp('approved_at'),
		paidAt: timestamp('paid_at'),
	},
	(table) => ({
		architectIdx: index('commissions_architect_id_idx').on(table.architectId),
		montageIdx: index('commissions_montage_id_idx').on(table.montageId),
		statusIdx: index('commissions_status_idx').on(table.status),
	})
);

export const commissionsRelations = relations(commissions, ({ one }) => ({
	architect: one(users, {
		fields: [commissions.architectId],
		references: [users.id],
		relationName: 'commission_architect',
	}),
	montage: one(montages, {
		fields: [commissions.montageId],
		references: [montages.id],
		relationName: 'commission_montage',
	}),
}));

export const partnerPayoutStatuses = ['pending', 'paid', 'rejected'] as const;
export type PartnerPayoutStatus = (typeof partnerPayoutStatuses)[number];

export const partnerPayouts = pgTable(
    'partner_payouts',
    {
        id: text('id').primaryKey(),
        partnerId: text('partner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        amount: integer('amount').notNull(), // in minor units (grosze)
        status: text('status').$type<PartnerPayoutStatus>().notNull().default('pending'),
        invoiceUrl: text('invoice_url'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        paidAt: timestamp('paid_at'),
        rejectionReason: text('rejection_reason'),
    },
    (table) => ({
        partnerIdx: index('partner_payouts_partner_id_idx').on(table.partnerId),
        statusIdx: index('partner_payouts_status_idx').on(table.status),
    })
);

export const partnerPayoutsRelations = relations(partnerPayouts, ({ one }) => ({
    partner: one(users, {
        fields: [partnerPayouts.partnerId],
        references: [users.id],
    }),
}));

export const partnerCommissions = pgTable(
    'partner_commissions',
    {
        id: text('id').primaryKey(),
        partnerId: text('partner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        montageId: text('montage_id')
            .notNull()
            .references(() => montages.id, { onDelete: 'cascade' }),
        amount: integer('amount').notNull(), // in minor units (grosze)
        rate: real('rate').notNull().default(0), // PLN per m2
        area: real('area').notNull().default(0), // m2
        status: text('status').$type<CommissionStatus>().notNull().default('pending'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        approvedAt: timestamp('approved_at'),
    },
    (table) => ({
        partnerIdx: index('partner_commissions_partner_id_idx').on(table.partnerId),
        montageIdx: index('partner_commissions_montage_id_idx').on(table.montageId),
    })
);

export const partnerCommissionsRelations = relations(partnerCommissions, ({ one }) => ({
    partner: one(users, {
        fields: [partnerCommissions.partnerId],
        references: [users.id],
    }),
    montage: one(montages, {
        fields: [partnerCommissions.montageId],
        references: [montages.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
	commissions: many(commissions, { relationName: 'commission_architect' }),
	architectMontages: many(montages, { relationName: 'montage_architect' }),
    // assignedProducts: many(architectProducts),
    partnerPayouts: many(partnerPayouts),
    partnerCommissions: many(partnerCommissions),
    serviceRates: many(userServiceRates),
}));

// Legacy architect products removed


export const contractTemplates = pgTable('contract_templates', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    content: text('content').notNull(), // Markdown content with placeholders
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const quotesRelations = relations(quotes, ({ one }) => ({
    montage: one(montages, {
        fields: [quotes.montageId],
        references: [montages.id],
    }),
}));

// --- ERP MODULE ---

export const suppliers = pgTable('suppliers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    nip: text('nip'),
    contactPerson: text('contact_person'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const purchaseOrderStatuses = ['draft', 'ordered', 'received', 'cancelled'] as const;
export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export const purchaseOrders = pgTable('purchase_orders', {
    id: text('id').primaryKey(),
    supplierId: text('supplier_id').references(() => suppliers.id),
    status: text('status').$type<PurchaseOrderStatus>().notNull().default('draft'),
    orderDate: timestamp('order_date'),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    totalNet: integer('total_net').notNull().default(0),
    totalGross: integer('total_gross').notNull().default(0),
    currency: text('currency').notNull().default('PLN'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: text('id').primaryKey(),
    purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    productId: integer('product_id'), // Link to existing products (Legacy)
    productName: text('product_name').notNull(), // Snapshot or manual item
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(), // Net price
    vatRate: integer('vat_rate').notNull(),
    totalNet: integer('total_net').notNull(),
    totalGross: integer('total_gross').notNull(),
    montageId: text('montage_id').references(() => montages.id, { onDelete: 'set null' }),
});

export const warehouseMovementTypes = ['in_purchase', 'out_sale', 'out_montage', 'adjustment', 'return'] as const;
export type WarehouseMovementType = (typeof warehouseMovementTypes)[number];

export const warehouseMovements = pgTable('warehouse_movements', {
    id: text('id').primaryKey(),
    productId: integer('product_id').notNull(),
    type: text('type').$type<WarehouseMovementType>().notNull(),
    quantity: integer('quantity').notNull(), // Positive for IN, Negative for OUT
    referenceId: text('reference_id'), // ID of PO, Order, or Montage
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: text('created_by').references(() => users.id),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    supplier: one(suppliers, {
        fields: [purchaseOrders.supplierId],
        references: [suppliers.id],
    }),
    items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderItems.purchaseOrderId],
        references: [purchaseOrders.id],
    }),
    // product: one(products, {
    //     fields: [purchaseOrderItems.productId],
    //     references: [products.id],
    // }),
    montage: one(montages, {
        fields: [purchaseOrderItems.montageId],
        references: [montages.id],
    }),
}));

export const warehouseMovementsRelations = relations(warehouseMovements, ({ one }) => ({
    // product: one(products, {
    //     fields: [warehouseMovements.productId],
    //     references: [products.id],
    // }),
    user: one(users, {
        fields: [warehouseMovements.createdBy],
        references: [users.id],
    }),
}));

export const settlementStatuses = ['draft', 'pending', 'approved', 'paid'] as const;
export type SettlementStatus = (typeof settlementStatuses)[number];

export const settlements = pgTable('settlements', {
    id: text('id').primaryKey(),
    montageId: text('montage_id').notNull().references(() => montages.id),
    installerId: text('installer_id').notNull().references(() => users.id),
    status: text('status').$type<SettlementStatus>().notNull().default('draft'),
    totalAmount: doublePrecision('total_amount').notNull(),
    calculations: json('calculations').notNull(),
    note: text('note'),
    overrideAmount: doublePrecision('override_amount'),
    overrideReason: text('override_reason'),
    corrections: json('corrections'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const advanceStatuses = ['pending', 'paid', 'deducted'] as const;
export type AdvanceStatus = (typeof advanceStatuses)[number];

export const advances = pgTable('advances', {
    id: text('id').primaryKey(),
    installerId: text('installer_id').notNull().references(() => users.id),
    amount: doublePrecision('amount').notNull(),
    status: text('status').$type<AdvanceStatus>().notNull().default('pending'),
    requestDate: timestamp('request_date').notNull().defaultNow(),
    paidDate: timestamp('paid_date'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const settlementsRelations = relations(settlements, ({ one }) => ({
    montage: one(montages, {
        fields: [settlements.montageId],
        references: [montages.id],
    }),
    installer: one(users, {
        fields: [settlements.installerId],
        references: [users.id],
    }),
}));

export const advancesRelations = relations(advances, ({ one }) => ({
    installer: one(users, {
        fields: [advances.installerId],
        references: [users.id],
    }),
}));

// --- SERVICE CATALOG & RATES ---

export const services = pgTable('services', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    unit: text('unit').notNull(), // m2, mb, szt, kpl
    vatRate: doublePrecision('vat_rate').default(0.23),
    basePriceNet: doublePrecision('base_price_net').default(0), // Client price
    baseInstallerRate: doublePrecision('base_installer_rate').default(0), // Default installer rate
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

export const userServiceRates = pgTable('user_service_rates', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    serviceId: text('service_id').references(() => services.id).notNull(),
    customRate: doublePrecision('custom_rate').notNull(), // The override rate
    updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
    unq: uniqueIndex('user_service_rate_unq').on(t.userId, t.serviceId),
}));

export const montageServiceItems = pgTable('montage_service_items', {
    id: text('id').primaryKey(),
    montageId: text('montage_id').references(() => montages.id).notNull(),
    serviceId: text('service_id').references(() => services.id).notNull(),
    
    quantity: doublePrecision('quantity').notNull(),
    
    // Snapshots
    snapshotName: text('snapshot_name'), // Name at the time of adding
    installerRate: doublePrecision('installer_rate').notNull(), 
    clientPrice: doublePrecision('client_price').notNull(),
    vatRate: doublePrecision('vat_rate').default(0.23), // Snapshot VAT
    
    createdAt: timestamp('created_at').defaultNow(),
});

export const servicesRelations = relations(services, ({ many }) => ({
    userRates: many(userServiceRates),
    montageItems: many(montageServiceItems),
}));

export const userServiceRatesRelations = relations(userServiceRates, ({ one }) => ({
    user: one(users, {
        fields: [userServiceRates.userId],
        references: [users.id],
    }),
    service: one(services, {
        fields: [userServiceRates.serviceId],
        references: [services.id],
    }),
}));

export const montageServiceItemsRelations = relations(montageServiceItems, ({ one }) => ({
    montage: one(montages, {
        fields: [montageServiceItems.montageId],
        references: [montages.id],
    }),
    service: one(services, {
        fields: [montageServiceItems.serviceId],
        references: [services.id],
    }),
}));

// --- ERP MODULE TABLES ---

// 1. Suppliers (Dostawcy)
export const erpSuppliers = pgTable('erp_suppliers', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    shortName: text('short_name'), // For display
    nip: text('nip'),
    email: text('email'),
    phone: text('phone'),
    website: text('website'),
    address: json('address'), // { street, city, zip, country }
    bankAccount: text('bank_account'),
    paymentTerms: integer('payment_terms').default(14), // Days
    description: text('description'),
    status: text('status').default('active'), // active, inactive
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Product Categories (Kategorie Produktów)
export const erpCategories = pgTable('erp_categories', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    parentId: text('parent_id'), // For hierarchy
    slug: text('slug').unique(),
    createdAt: timestamp('created_at').defaultNow(),
});

// 3. Products (Kartoteka Towarowa)
export const erpProducts = pgTable('erp_products', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sku: text('sku').unique().notNull(), // Kod produktu
    ean: text('ean'), // Kod kreskowy
    name: text('name').notNull(),
    description: text('description'),
    categoryId: text('category_id').references(() => erpCategories.id),
    unit: text('unit').default('szt'), // szt, m2, mb, kpl, opak
    
    // Dimensions & Weight
    width: doublePrecision('width'),
    height: doublePrecision('height'),
    length: doublePrecision('length'),
    weight: doublePrecision('weight'),
    
    // Type
    type: text('type').default('product'), // product, service
    
    // Status
    status: text('status').default('active'), // active, archived
    
    // Media
    imageUrl: text('image_url'),

    // Woo Data
    price: text('price'),
    regularPrice: text('regular_price'),
    salePrice: text('sale_price'),
    stockQuantity: integer('stock_quantity'),
    
    source: text('source').default('local'), // local, woocommerce
    isSyncEnabled: boolean('is_sync_enabled').default(false),
    wooId: integer('woo_id'),

    leadTime: text('lead_time'), // e.g. "3-5 dni"

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Purchase Prices (Cenniki Zakupowe)
export const erpPurchasePrices = pgTable('erp_purchase_prices', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id').references(() => erpProducts.id).notNull(),
    supplierId: text('supplier_id').references(() => erpSuppliers.id).notNull(),
    
    supplierSku: text('supplier_sku'), // Kod u dostawcy
    
    netPrice: doublePrecision('net_price').notNull(),
    currency: text('currency').default('PLN'),
    vatRate: doublePrecision('vat_rate').default(0.23),
    
    minOrderQuantity: doublePrecision('min_order_quantity').default(1),
    
    isDefault: boolean('is_default').default(false), // Główny dostawca
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Inventory Items (Stany Magazynowe - Simple version for now)
export const erpInventory = pgTable('erp_inventory', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id').references(() => erpProducts.id).notNull(),
    warehouseId: text('warehouse_id'), // Optional if multiple warehouses
    
    quantityOnHand: doublePrecision('quantity_on_hand').default(0),
    quantityReserved: doublePrecision('quantity_reserved').default(0),
    quantityAvailable: doublePrecision('quantity_available').default(0), // Computed or stored
    
    location: text('location'), // Shelf/Bin
    
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Attributes Definition (Słownik Atrybutów)
export const erpAttributes = pgTable('erp_attributes', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(), // np. "Klasa ścieralności", "Kolor"
    type: text('type').default('select'), // select, text, number
    categoryId: text('category_id').references(() => erpCategories.id), // Opcjonalne przypisanie do kategorii
    createdAt: timestamp('created_at').defaultNow(),
});

// 7. Attribute Options (Wartości Słownika)
export const erpAttributeOptions = pgTable('erp_attribute_options', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    attributeId: text('attribute_id').references(() => erpAttributes.id).notNull(),
    value: text('value').notNull(), // np. "AC4", "AC5"
    order: integer('order').default(0),
});

// 8. Product Attributes (Wartości Produktów)
export const erpProductAttributes = pgTable('erp_product_attributes', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id').references(() => erpProducts.id).notNull(),
    attributeId: text('attribute_id').references(() => erpAttributes.id).notNull(),
    
    // Wartość może być wybrana ze słownika LUB wpisana ręcznie (jeśli typ=text)
    optionId: text('option_id').references(() => erpAttributeOptions.id), 
    value: text('value'), // Fallback dla wartości tekstowych/liczbowych
});

// --- ERP RELATIONS ---

export const erpProductsRelations = relations(erpProducts, ({ one, many }) => ({
    category: one(erpCategories, {
        fields: [erpProducts.categoryId],
        references: [erpCategories.id],
    }),
    purchasePrices: many(erpPurchasePrices),
    inventory: many(erpInventory),
    attributes: many(erpProductAttributes),
}));

export const erpAttributesRelations = relations(erpAttributes, ({ one, many }) => ({
    category: one(erpCategories, {
        fields: [erpAttributes.categoryId],
        references: [erpCategories.id],
    }),
    options: many(erpAttributeOptions),
}));

export const erpAttributeOptionsRelations = relations(erpAttributeOptions, ({ one }) => ({
    attribute: one(erpAttributes, {
        fields: [erpAttributeOptions.attributeId],
        references: [erpAttributes.id],
    }),
}));

export const erpProductAttributesRelations = relations(erpProductAttributes, ({ one }) => ({
    product: one(erpProducts, {
        fields: [erpProductAttributes.productId],
        references: [erpProducts.id],
    }),
    attribute: one(erpAttributes, {
        fields: [erpProductAttributes.attributeId],
        references: [erpAttributes.id],
    }),
    option: one(erpAttributeOptions, {
        fields: [erpProductAttributes.optionId],
        references: [erpAttributeOptions.id],
    }),
}));

export const erpSuppliersRelations = relations(erpSuppliers, ({ many }) => ({
    purchasePrices: many(erpPurchasePrices),
}));

export const erpCategoriesRelations = relations(erpCategories, ({ one, many }) => ({
    parent: one(erpCategories, {
        fields: [erpCategories.parentId],
        references: [erpCategories.id],
        relationName: 'category_hierarchy'
    }),
    children: many(erpCategories, {
        relationName: 'category_hierarchy'
    }),
    products: many(erpProducts),
}));

export const erpPurchasePricesRelations = relations(erpPurchasePrices, ({ one }) => ({
    product: one(erpProducts, {
        fields: [erpPurchasePrices.productId],
        references: [erpProducts.id],
    }),
    supplier: one(erpSuppliers, {
        fields: [erpPurchasePrices.supplierId],
        references: [erpSuppliers.id],
    }),
}));

export const erpInventoryRelations = relations(erpInventory, ({ one }) => ({
    product: one(erpProducts, {
        fields: [erpInventory.productId],
        references: [erpProducts.id],
    }),
}));



export const smartDeviceTypes = ['switchBox', 'shutterBox', 'gateBox', 'wLightBox', 'other'] as const;
export type SmartDeviceType = (typeof smartDeviceTypes)[number];

export const smartDevices = pgTable('smart_devices', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    ipAddress: text('ip_address').notNull(),
    type: text('type', { enum: smartDeviceTypes }).notNull(),
    room: text('room'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

