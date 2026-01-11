'use server';

import { db } from '@/lib/db';
import { erpProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleShopVisibility(productId: string, isVisible: boolean) {
    await db
        .update(erpProducts)
        .set({ isShopVisible: isVisible })
        .where(eq(erpProducts.id, productId));

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
