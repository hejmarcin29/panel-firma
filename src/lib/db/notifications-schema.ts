import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'sms', 'system']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed']);

// 1. Templates Configuration
export const notificationTemplates = pgTable('notification_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: varchar('event_id', { length: 100 }).notNull(), // e.g. 'ORDER_CREATED'
    channel: notificationChannelEnum('channel').notNull(),
    
    // Content
    subject: text('subject'), // Only for Email
    content: text('content').notNull(), // HTML for email, Text for SMS
    
    // Configuration
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'), // For admin UI: "Wysyłane do klienta po opłaceniu"
    
    // Dynamic Chips/Variables hint (JSON array of available variables for UI)
    // e.g. ['order_id', 'client_name', 'tracking_link']
    availableVariables: jsonb('available_variables').$type<string[]>(), 
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    eventChannelIdx: index('idx_notification_templates_event_channel').on(table.eventId, table.channel),
}));

// 2. Logs (History)
export const notificationLogs = pgTable('notification_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Context
    eventId: varchar('event_id', { length: 100 }).notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    
    // Recipient
    recipient: text('recipient').notNull(), // email or phone number
    
    // Content Snapshot (what was actually sent)
    subject: text('subject'),
    content: text('content'),
    
    // Status
    status: notificationStatusEnum('status').default('pending').notNull(),
    error: text('error'),
    providerId: text('provider_id'), // Message ID from SMSAPI / SMTP
    
    // Relation (Polymorphic-ish)
    relatedEntityId: varchar('related_entity_id', { length: 255 }), // orderId, montageId
    relatedEntityType: varchar('related_entity_type', { length: 50 }), // 'order', 'montage'
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    entityIdx: index('idx_notification_logs_entity').on(table.relatedEntityId, table.relatedEntityType),
    createdIdx: index('idx_notification_logs_created').on(table.createdAt),
}));

// Relations
// We might want relations to specific tables if we want clean DB structure, 
// but for a generic log, loose coupling via ID string is often flexible enough 
// for "Show all notifications for this ID".
