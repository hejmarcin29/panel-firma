'use server';

import { db } from '@/lib/db';
import { erpProducts } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils';

export async function toggleShopVisibility(productId: string, isVisible: boolean) {
    if (!isVisible) {
        await db
            .update(erpProducts)
            .set({ isShopVisible: false })
            .where(eq(erpProducts.id, productId));
    } else {
        const product = await db.query.erpProducts.findFirst({
            where: eq(erpProducts.id, productId),
            columns: {
                id: true,
                slug: true,
                name: true
            }
        });

        if (!product) return;

        let slug = product.slug;

        if (!slug) {
            slug = slugify(product.name);
        }

        await db
            .update(erpProducts)
            .set({ 
                isShopVisible: true,
                slug: slug
            })
            .where(eq(erpProducts.id, productId));
    }

    revalidatePath('/dashboard/shop/offer');
    revalidatePath('/sklep');
}

export async function toggleSampleAvailability(productId: string, isAvailable: boolean) {
    await db
        .update(erpProducts)
        .set({ isSampleAvailable: isAvailable })
        .where(eq(erpProducts.id, productId));

    revalidatePath('/dashboard/shop/offer');
    revalidatePath('/sklep');
}

export async function togglePurchasable(productId: string, isPurchasable: boolean) {
    await db
        .update(erpProducts)
        .set({ isPurchasable: isPurchasable })
        .where(eq(erpProducts.id, productId));

    revalidatePath('/dashboard/shop/offer');
    revalidatePath('/sklep');
}

export async function bulkToggleShopVisibility(ids: string[], isVisible: boolean) {
    if (!ids.length) return;

    await db.update(erpProducts)
        .set({ isShopVisible: isVisible })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/shop/offer');
}

export async function bulkTogglePurchasable(ids: string[], isPurchasable: boolean) {
    if (!ids.length) return;

    await db.update(erpProducts)
        .set({ isPurchasable: isPurchasable })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/shop/offer');
}

export async function bulkToggleSamplesAvailability(ids: string[], isAvailable: boolean) {
    if (!ids.length) return;

    await db.update(erpProducts)
        .set({ isSampleAvailable: isAvailable })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/shop/offer');
}

