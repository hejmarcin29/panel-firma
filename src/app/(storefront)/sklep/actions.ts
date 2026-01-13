'use server';

import { db } from '@/lib/db';
import { erpProducts, erpCategories } from '@/lib/db/schema';
import { eq, desc, and, ilike } from 'drizzle-orm';

export async function getStoreCategories() {
    return db.query.erpCategories.findMany({
        orderBy: [desc(erpCategories.name)],
        columns: {
            id: true,
            name: true,
            slug: true,
        }
    });
}

export async function getStoreProducts(limit?: number, query?: string, categorySlug?: string) {
    const whereConditions = [eq(erpProducts.isShopVisible, true)];
    
    if (query) {
        whereConditions.push(ilike(erpProducts.name, `%${query}%`));
    }

    if (categorySlug) {
        const category = await db.query.erpCategories.findFirst({
            where: eq(erpCategories.slug, categorySlug),
            columns: { id: true }
        });

        if (category) {
            whereConditions.push(eq(erpProducts.categoryId, category.id));
        }
    }

    const products = await db.query.erpProducts.findMany({
        where: and(...whereConditions),
        orderBy: [desc(erpProducts.isPurchasable), desc(erpProducts.imageUrl)],
        limit: limit,
        columns: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            price: true,
            salePrice: true,
            unit: true,
            isPurchasable: true,
            isSampleAvailable: true,
        }
    });

    return products;
}
