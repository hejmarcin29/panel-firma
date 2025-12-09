'use server';

import { db } from '@/lib/db';
import { quotes, type QuoteItem, type QuoteStatus } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function getQuotes() {
    return await db.query.quotes.findMany({
        with: {
            montage: true,
        },
        orderBy: [desc(quotes.createdAt)],
    });
}

export async function getQuote(id: string) {
    return await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
        with: {
            montage: true,
        },
    });
}

export async function createQuote(montageId: string) {
    const id = randomUUID();
    await db.insert(quotes).values({
        id,
        montageId,
        status: 'draft',
        items: [],
    });
    revalidatePath('/dashboard/wyceny');
    revalidatePath(`/dashboard/montaze/${montageId}`);
    return id;
}

export async function updateQuote(id: string, data: {
    status?: QuoteStatus;
    items?: QuoteItem[];
    validUntil?: Date;
    notes?: string;
}) {
    // Calculate totals if items are updated
    const updates: Partial<typeof quotes.$inferInsert> = { ...data };
    
    if (data.items) {
        const totalNet = data.items.reduce((sum, item) => sum + item.totalNet, 0);
        const totalGross = data.items.reduce((sum, item) => sum + item.totalGross, 0);
        updates.totalNet = totalNet;
        updates.totalGross = totalGross;
    }

    await db.update(quotes).set({
        ...updates,
        updatedAt: new Date(),
    }).where(eq(quotes.id, id));

    revalidatePath('/dashboard/wyceny');
    revalidatePath(`/dashboard/wyceny/${id}`);
}

export async function deleteQuote(id: string) {
    await db.delete(quotes).where(eq(quotes.id, id));
    revalidatePath('/dashboard/wyceny');
}
