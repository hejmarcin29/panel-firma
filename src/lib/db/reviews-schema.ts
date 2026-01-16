import { pgTable, text, integer, boolean, timestamp, json, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { erpProducts, orders } from './schema';

// --- OPINIE PRODUKTOWE ---

export const reviewStatus = ['pending', 'published', 'rejected'] as const;
export type ReviewStatus = (typeof reviewStatus)[number];

export const reviewSource = ['manual', 'magic_link'] as const;
export type ReviewSource = (typeof reviewSource)[number];

export const erpProductReviews = pgTable('erp_product_reviews', {
    id: text('id').primaryKey(), // UUID
    productId: text('product_id').notNull().references(() => erpProducts.id),
    
    rating: integer('rating').notNull(), // 1-5
    content: text('content'),
    authorName: text('author_name'), // Imię klienta
    
    isVerified: boolean('is_verified').default(false).notNull(), // Czy z zakupu?
    source: text('source').$type<ReviewSource>().default('manual').notNull(),
    status: text('status').$type<ReviewStatus>().default('pending').notNull(),
    
    // Opcjonalne powiązanie z zamówieniem (dla weryfikacji)
    orderId: text('order_id').references(() => orders.id),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    productIdx: index('erp_reviews_product_idx').on(table.productId),
    statusIdx: index('erp_reviews_status_idx').on(table.status),
}));

export const erpProductReviewsRelations = relations(erpProductReviews, ({ one }) => ({
    product: one(erpProducts, {
        fields: [erpProductReviews.productId],
        references: [erpProducts.id],
    }),
    order: one(orders, {
        fields: [erpProductReviews.orderId],
        references: [orders.id],
    }),
}));

// --- OŚ CZASU ZAMÓWIENIA (TIMELINE) ---

export const timelineType = ['payment', 'status_change', 'email', 'system', 'customer_action'] as const;
export type TimelineType = (typeof timelineType)[number];

export const erpOrderTimeline = pgTable('erp_order_timeline', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    
    type: text('type').notNull(), // Kategoria zdarzenia
    title: text('title').notNull(), // Np. "Płatność Tpay potwierdzona"
    
    // Metadane w JSON (wszystkie techniczne detale)
    // np. { transactionId: '...', ip: '...', amount: 123.00 }
    metadata: json('metadata'), 

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    orderTimelineIdx: index('erp_timeline_order_idx').on(table.orderId),
}));

export const erpOrderTimelineRelations = relations(erpOrderTimeline, ({ one }) => ({
    order: one(orders, {
        fields: [erpOrderTimeline.orderId],
        references: [orders.id],
    }),
}));
