'use server';

import { db } from '@/lib/db';
import { erpProductReviews, reviewStatus } from '@/lib/db/reviews-schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function submitReview(data: {
    productId: string;
    authorName: string;
    rating: number; // 1-5
    content: string;
}) {
    // Validate
    if (!data.productId) throw new Error("Missing Product ID");
    if (data.rating < 1 || data.rating > 5) throw new Error("Invalid Rating");
    if (!data.content || data.content.length < 5) throw new Error("Content too short");

    await db.insert(erpProductReviews).values({
        id: randomUUID(),
        productId: data.productId,
        authorName: data.authorName || 'Anonim',
        rating: data.rating,
        content: data.content,
        // Public submission is always pending unless we add auto-approval later
        status: 'pending', 
        source: 'manual', 
        isVerified: false, 
    });

    // Revalidate product page to show new stats if we auto-approved, 
    // but since it's pending, user won't see it yet. 
    // We revalidate anyway just in case logic changes.
    // revalidatePath(`/produkt/...`); // We don't have slug here easily, but that's fine.
    
    return { success: true };
}

export async function getProductReviews(productId: string) {
    // Fetch only PUBLISHED reviews
    const reviews = await db.select().from(erpProductReviews)
        .where(
            and(
                eq(erpProductReviews.productId, productId),
                eq(erpProductReviews.status, 'published')
            )
        )
        .orderBy(desc(erpProductReviews.createdAt));
    
    return reviews;
}
