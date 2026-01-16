'use server';

import { db } from '@/lib/db';
import { orders, documents, documentEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { uploadOrderDocument } from '@/lib/r2/storage';

export async function uploadProforma(orderId: string, transferTitle: string, formData: FormData) {
    const file = formData.get('file') as File;
    const proformaNumber = formData.get('proformaNumber') as string || transferTitle;

    if (!file) {
        throw new Error('No file provided');
    }

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { displayNumber: true, id: true } 
    });
    
    if (!order) throw new Error('Order not found');

    const folderName = order.displayNumber || order.id;

    const pdfUrl = await uploadOrderDocument({
        orderNumber: folderName,
        file,
        type: 'proforma'
    });

    await db.update(orders)
        .set({ 
            status: 'order.awaiting_payment', 
            transferTitle: transferTitle
        })
        .where(eq(orders.id, orderId));

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        orderId: orderId,
        type: 'proforma',
        status: 'issued',
        number: proformaNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    await db.insert(documentEvents).values({
        id: randomUUID(),
        documentId: docId,
        status: 'issued',
        note: `Uploaded manually. File: ${file.name}`,
    });

    console.log(`[Email] Sending Proforma to customer for Order ${orderId}. Title: ${transferTitle}`);

    revalidatePath('/dashboard/shop/orders');
    revalidatePath(`/dashboard/shop/orders/${orderId}`);
}

export async function uploadFinalInvoice(orderId: string, formData: FormData) {
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { displayNumber: true, id: true } 
    });
    
    if (!order) throw new Error('Order not found');

    const folderName = order.displayNumber || order.id;

    const pdfUrl = await uploadOrderDocument({
        orderNumber: folderName,
        file,
        type: 'faktura'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        orderId: orderId,
        type: 'final_invoice',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    await db.update(orders)
        .set({ status: 'order.closed' })
        .where(eq(orders.id, orderId));

     revalidatePath('/dashboard/shop/orders');
     revalidatePath(`/dashboard/shop/orders/${orderId}`);
     return { success: true };
}

export async function uploadAdvanceInvoice(orderId: string, formData: FormData) {
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { displayNumber: true, id: true } 
    });
    if (!order) throw new Error('Order not found');

    const folderName = order.displayNumber || order.id;

    const pdfUrl = await uploadOrderDocument({
        orderNumber: folderName,
        file,
        type: 'zaliczka'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        orderId: orderId,
        type: 'advance_invoice',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    // Optional: Update status to indicate advance invoice issued, if flow requires it.
    // Usually status stays at 'paid' or specific 'advance_invoice' status
    await db.update(orders)
       .set({ status: 'order.advance_invoice' })
       .where(eq(orders.id, orderId));

     revalidatePath('/dashboard/shop/orders');
     revalidatePath(`/dashboard/shop/orders/${orderId}`);
     return { success: true };
}

export async function uploadCorrectionInvoice(orderId: string, formData: FormData) {
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { displayNumber: true, id: true } 
    });
    if (!order) throw new Error('Order not found');

    const folderName = order.displayNumber || order.id;

    const pdfUrl = await uploadOrderDocument({
        orderNumber: folderName,
        file,
        type: 'korekta'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        orderId: orderId,
        type: 'correction',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    // Logging event
    await db.insert(documentEvents).values({
        id: randomUUID(),
        documentId: docId,
        status: 'issued',
        note: `Correction uploaded manually. File: ${file.name}`,
    });

     revalidatePath('/dashboard/shop/orders');
     revalidatePath(`/dashboard/shop/orders/${orderId}`);
     return { success: true };
}

export async function updateShippingInfo(orderId: string, carrier: string, trackingNumber: string) {
    await db.update(orders)
        .set({
            shippingCarrier: carrier,
            shippingTrackingNumber: trackingNumber,
            status: 'order.fulfillment_confirmed' // Using this as 'Shipped' for samples
        })
        .where(eq(orders.id, orderId));
    
    revalidatePath('/dashboard/shop/orders');
}

export async function markAsPaid(orderId: string) {
     await db.update(orders)
        .set({
             status: 'order.paid'
        })
        .where(eq(orders.id, orderId));
    
    revalidatePath('/dashboard/shop/orders');
}

