import {
	doublePrecision,
    pgTable,
	text,
} from 'drizzle-orm/pg-core';
import { montages } from './schema';

export const montageFloorProducts = pgTable('montage_floor_products', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    montageId: text('montage_id')
        .notNull()
        .references(() => montages.id, { onDelete: 'cascade' }),
    productId: text('product_id'), // Optional link to ERP product
    name: text('name').notNull(), // Snapshot name (e.g. "Dąb Naturalny")
    area: doublePrecision('area').notNull().default(0), // Net area
    waste: doublePrecision('waste').notNull().default(0), // Waste percentage (e.g. 5, 10)
    installationMethod: text('installation_method').$type<'click' | 'glue'>().default('click'),
    layingDirection: text('laying_direction'),
    rooms: json('rooms').$type<{
        name: string;
        area: number;
    }[]>().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
