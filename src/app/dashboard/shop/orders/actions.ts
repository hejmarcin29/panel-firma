'use server';

import { db } from '@/lib/db';
import { orders, documents, documentEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function uploadProforma(orderId: string, transferTitle: string, pdfUrl: string) {
    // 1. Update Order
    await db.update(orders)
        .set({ 
            status: 'order.awaiting_payment', // payment_pending
            transferTitle: transferTitle
        })
        .where(eq(orders.id, orderId));

    // 2. Create Document record
    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        orderId: orderId,
        type: 'proforma',
        status: 'issued',
        number: transferTitle, // Use transfer title as number for simplicity or separate
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    // 3. Log Event
    await db.insert(documentEvents).values({
        id: randomUUID(),
        documentId: docId,
        status: 'issued',
        note: 'Uploaded manually via Shop Order Manager',
    });

    // 4. Send Email (Mock)
    console.log(`[Email] Sending Proforma to customer for Order ${orderId}. Title: ${transferTitle}`);

    revalidatePath('/dashboard/shop/orders');
}
