'use server';

import { db } from '@/lib/db';
import { erpProducts, erpCategories, erpBrands, erpCollections, erpMountingMethods, erpFloorPatterns, erpWearClasses, erpStructures } from '@/lib/db/schema';
import { eq, desc, and, ilike, inArray } from 'drizzle-orm';

export async function getStoreMountingMethods() {
    return db.select().from(erpMountingMethods).orderBy(erpMountingMethods.name);
}

export async function getStoreFloorPatterns() {
    return db.select().from(erpFloorPatterns).orderBy(erpFloorPatterns.name);
}

export async function getStoreWearClasses() {
    return db.select().from(erpWearClasses).orderBy(erpWearClasses.name);
}

export async function getStoreStructures() {
    return db.select().from(erpStructures).orderBy(erpStructures.name);
}

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
            description: true,
        }
    });
}

export async function getStoreProducts(
    limit?: number, 
    query?: string, 
    categorySlug?: string, 
    brandSlugs?: string[], 
    collectionSlugs?: string[],
    mountingMethodSlugs?: string[], // NEW
    floorPatternSlugs?: string[],   // NEW
    wearClassSlugs?: string[],      // NEW
) {
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

    // --- NEW Technical Filters ---

    if (mountingMethodSlugs && mountingMethodSlugs.length > 0) {
        const methods = await db.select({ id: erpMountingMethods.id })
            .from(erpMountingMethods)
            .where(inArray(erpMountingMethods.slug, mountingMethodSlugs));
            
        if (methods.length > 0) {
            whereConditions.push(inArray(erpProducts.mountingMethodId, methods.map(m => m.id)));
        }
    }

    if (floorPatternSlugs && floorPatternSlugs.length > 0) {
        const patterns = await db.select({ id: erpFloorPatterns.id })
            .from(erpFloorPatterns)
            .where(inArray(erpFloorPatterns.slug, floorPatternSlugs));

        if (patterns.length > 0) {
            whereConditions.push(inArray(erpProducts.floorPatternId, patterns.map(p => p.id)));
        }
    }

    if (wearClassSlugs && wearClassSlugs.length > 0) {
        const classes = await db.select({ id: erpWearClasses.id })
            .from(erpWearClasses)
            .where(inArray(erpWearClasses.slug, wearClassSlugs));

        if (classes.length > 0) {
            whereConditions.push(inArray(erpProducts.wearClassId, classes.map(c => c.id)));
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

export async function getExplorerProducts() {
    return db.query.erpProducts.findMany({
        where: eq(erpProducts.isShopVisible, true),
        orderBy: [desc(erpProducts.isPurchasable), desc(erpProducts.imageUrl)],
        limit: 100,
        columns: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            price: true,
            salePrice: true,
            unit: true,
            isPurchasable: true,
        },
        with: {
            collection: {
                columns: { name: true }
            },
            mountingMethodDictionary: {
                columns: { name: true, slug: true }
            },
            floorPatternDictionary: {
                columns: { name: true, slug: true }
            },
            wearClassDictionary: {
                columns: { name: true, slug: true }
            }
        }
    });
}
