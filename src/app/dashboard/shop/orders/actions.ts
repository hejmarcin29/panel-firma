'use server';

import { db } from '@/lib/db';
import { orders, documents, documentEvents, erpOrderTimeline } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { uploadOrderDocument } from '@/lib/r2/storage';
import { customers } from '@/lib/db/schema'; // Added customers import

export async function updateOrderData(orderId: string, data: {
    billing: {
        name: string;
        taxId: string;
        street: string;
        postalCode: string;
        city: string;
        email: string;
        phone: string;
    },
    shipping: {
        name: string;
        street: string;
        postalCode: string;
        city: string;
        phone: string;
        email: string;
    }
}) {
    // 1. Update Order Snapshots
    await db.update(orders)
        .set({
            billingAddress: {
                name: data.billing.name,
                taxId: data.billing.taxId,
                street: data.billing.street,
                postalCode: data.billing.postalCode,
                city: data.billing.city,
                email: data.billing.email,
                phone: data.billing.phone,
                // Preserve other fields if needed, but for now we overwrite based on form
                // Ideally we should fetch and merge, but simplification for now
                country: 'PL' 
            },
            shippingAddress: {
                name: data.shipping.name,
                street: data.shipping.street,
                postalCode: data.shipping.postalCode,
                city: data.shipping.city,
                phone: data.shipping.phone,
                email: data.shipping.email,
                country: 'PL'
            }
        })
        .where(eq(orders.id, orderId));

    // 2. Timeline Event
    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'system',
        title: 'Zaktualizowano dane zamówienia',
        metadata: {
            details: 'Edycja adresu/danych klienta'
        }
    });

    // 3. Update Customer Profile (Optional - Best Effort)
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { customerId: true }
    });

    if (order?.customerId) {
        // We only update contact info, not addresses to avoid messing up history? 
        // Or we update everything? Let's update basic info.
        await db.update(customers)
            .set({
                name: data.billing.name,
                taxId: data.billing.taxId,
                email: data.billing.email,
                phone: data.billing.phone
            })
            .where(eq(customers.id, order.customerId));
    }

    revalidatePath(`/dashboard/shop/orders/${orderId}`);
}

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

    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'status_change',
        title: 'Wysłano proformę',
        metadata: { 
            fileName: file.name,
            transferTitle: transferTitle
        }
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

    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'status_change', // or 'document'
        title: 'Wystawiono Fakturę Końcową',
        metadata: { 
            fileName: file.name,
            invoiceNumber: invoiceNumber
        }
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

    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'status_change',
        title: 'Wystawiono Fakturę Zaliczkową',
        metadata: { 
            fileName: file.name,
            invoiceNumber: invoiceNumber
        }
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

    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'status_change',
        title: 'Wystawiono Korektę Faktury',
        metadata: { 
            fileName: file.name,
            invoiceNumber: invoiceNumber
        }
    });

     revalidatePath('/dashboard/shop/orders');
     revalidatePath(`/dashboard/shop/orders/${orderId}`);
    await db.insert(erpOrderTimeline).values({
        id: randomUUID(),
        orderId: orderId,
        type: 'payment',
        title: 'Płatność potwierdzona ręcznie',
        metadata: { method: 'manual' }
    });

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

