'use server';

import { db } from '@/lib/db';
import { erpProductReviews, erpProducts } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getReviews() {
    return await db.query.erpProductReviews.findMany({
        with: {
            product: true
        },
        orderBy: [desc(erpProductReviews.createdAt)],
    });
}

export async function deleteReview(id: string) {
    if (!id) return;
    await db.delete(erpProductReviews).where(eq(erpProductReviews.id, id));
    revalidatePath('/dashboard/shop/reviews');
}

export async function toggleReviewStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'pending' : 'published';
    await db.update(erpProductReviews)
        .set({ status: newStatus })
        .where(eq(erpProductReviews.id, id));
    revalidatePath('/dashboard/shop/reviews');
}

export async function createManualReview(data: any) {
    if (!data.productId || !data.rating || !data.content) {
        throw new Error('Rating, Product and Content are required');
    }

    const id = crypto.randomUUID();

    await db.insert(erpProductReviews).values({
        id: id,
        productId: data.productId,
        rating: parseInt(data.rating),
        content: data.content,
        authorName: data.authorName || 'Anonim',
        isVerified: false, // Manual reviews are technically not verified by system purchase flow logic usually, or maybe true if admin says so?
        // Let's set verified to true if admin adds it? Or false? 
        // User asked to "copy from SMS", so it IS a verified customer usually. 
        // Let's allow passing isVerified or default to true for manual admin entry?
        // Let's default manual source to... 'manual'.
        isVerified: true, // Admin knows best.
        source: 'manual',
        status: 'published', // Admin added it, so it's published.
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
    });

    revalidatePath('/dashboard/shop/reviews');
    // Also revalidate product page
    // revalidatePath(`/produkt/${productSlug}`); // We'd need slug efficiently.
}
