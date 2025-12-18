'use server';

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { desc, eq, sql, and, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type Product = typeof products.$inferSelect;

export async function getProducts(
    page: number = 1,
    perPage: number = 20,
    search?: string,
    source?: 'woocommerce' | 'local'
) {
    const offset = (page - 1) * perPage;

    const whereClause = and(
        search ? or(
            like(products.name, `%${search}%`),
            like(products.sku, `%${search}%`)
        ) : undefined,
        source ? eq(products.source, source) : undefined,
        sql`${products.deletedAt} IS NULL`
    );

    const [data, countResult] = await Promise.all([
        db.select()
            .from(products)
            .where(whereClause)
            .limit(perPage)
            .offset(offset)
            .orderBy(desc(products.updatedAt)),
        db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(whereClause)
    ]);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / perPage);

    return {
        data,
        total,
        totalPages,
        currentPage: page
    };
}

export async function createProduct(data: {
    name: string;
    sku?: string;
    unit?: string;
    vatRate?: number;
    purchasePrice?: number;
    description?: string;
    stockQuantity?: number;
    attributes?: any[];
}) {
    // Generate a random ID for local product (avoiding WP range)
    // WP IDs are usually sequential integers. Let's use a range starting from 100,000,000
    const id = Math.floor(Math.random() * 100000000) + 100000000;

    await db.insert(products).values({
        id,
        name: data.name,
        sku: data.sku,
        slug: `local-${id}`, // Temporary slug
        status: 'publish',
        source: 'local',
        unit: data.unit || 'szt',
        vatRate: data.vatRate || 23,
        purchasePrice: data.purchasePrice, // grosze
        description: data.description,
        stockQuantity: data.stockQuantity || 0,
        stockStatus: (data.stockQuantity || 0) > 0 ? 'instock' : 'outofstock',
        attributes: data.attributes ? JSON.stringify(data.attributes) : null,
        syncedAt: new Date(),
    });

    revalidatePath('/dashboard/erp/kartoteki');
    return { success: true, id };
}

export async function updateProduct(id: number, data: {
    name?: string;
    sku?: string;
    unit?: string;
    vatRate?: number;
    purchasePrice?: number;
    description?: string;
    stockQuantity?: number;
}) {
    await db.update(products)
        .set({
            ...data,
            updatedAt: new Date(),
            stockStatus: data.stockQuantity !== undefined 
                ? (data.stockQuantity > 0 ? 'instock' : 'outofstock') 
                : undefined
        })
        .where(eq(products.id, id));

    revalidatePath('/dashboard/erp/kartoteki');
    return { success: true };
}

export async function deleteProduct(id: number) {
    await db.update(products)
        .set({ deletedAt: new Date() })
        .where(eq(products.id, id));

    revalidatePath('/dashboard/erp/kartoteki');
    return { success: true };
}

export async function convertToLocalProduct(id: number) {
    await db.update(products)
        .set({ 
            source: 'local',
            updatedAt: new Date()
        })
        .where(eq(products.id, id));

    revalidatePath('/dashboard/erp/kartoteki');
    return { success: true };
}
