'use server';

import { db } from '@/lib/db';
import { erpProducts, erpCategories, erpBrands, erpCollections } from '@/lib/db/schema';
import { eq, desc, and, ilike, inArray } from 'drizzle-orm';

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

export async function getStoreBrands() {
    return db.query.erpBrands.findMany({
        orderBy: [desc(erpBrands.name)],
        columns: {
            id: true,
            name: true,
            slug: true,
        }
    });
}

export async function getStoreCollections() {
    return db.query.erpCollections.findMany({
        orderBy: [desc(erpCollections.name)],
        with: {
            brand: {
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                }
            }
        },
        columns: {
            id: true,
            name: true,
            slug: true,
            brandId: true,
        }
    });
}

export async function getStoreProducts(limit?: number, query?: string, categorySlug?: string, brandSlugs?: string[], collectionSlugs?: string[]) {
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

    if (brandSlugs && brandSlugs.length > 0) {
        // Find brand IDs from slugs
        const brands = await db.query.erpBrands.findMany({
            where: inArray(erpBrands.slug, brandSlugs),
            columns: { id: true }
        });
        
        if (brands.length > 0) {
            whereConditions.push(inArray(erpProducts.brandId, brands.map(b => b.id)));
        }
    }

    if (collectionSlugs && collectionSlugs.length > 0) {
        // Find collection IDs from slugs
        const collections = await db.query.erpCollections.findMany({
            where: inArray(erpCollections.slug, collectionSlugs),
            columns: { id: true }
        });
        
        if (collections.length > 0) {
            whereConditions.push(inArray(erpProducts.collectionId, collections.map(c => c.id)));
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
