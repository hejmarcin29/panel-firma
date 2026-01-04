'use server';

import { db } from '@/lib/db';
import { suppliers, purchaseOrders, products, documents, montageChecklistItems, montageAttachments } from '@/lib/db/schema';
import { desc, isNull, ilike, or, inArray, and, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { nanoid } from 'nanoid';

export async function createSupplier(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    nip?: string;
    contactPerson?: string;
}) {
    await requireUser();
    
    await db.insert(suppliers).values({
        id: nanoid(),
        ...data,
    });

    revalidatePath('/dashboard/erp/suppliers');
}

export async function getSuppliers() {
    await requireUser();
    return await db.query.suppliers.findMany({
        orderBy: [desc(suppliers.createdAt)],
    });
}

export async function getPurchaseOrders() {
    await requireUser();
    return await db.query.purchaseOrders.findMany({
        with: {
            supplier: true,
        },
        orderBy: [desc(purchaseOrders.createdAt)],
    });
}

export async function getWarehouseStock() {
    await requireUser();
    return await db.query.products.findMany({
        where: isNull(products.deletedAt),
        orderBy: [desc(products.updatedAt)],
        limit: 50,
    });
}

export async function getInvoices() {
    await requireUser();
    return await db.query.documents.findMany({
        orderBy: [desc(documents.createdAt)],
        limit: 50,
    });
}

export async function getInvoiceAttachments() {
    await requireUser();

    const attachments = await db.query.montageAttachments.findMany({
        where: (table, { inArray }) => inArray(table.type, ['proforma', 'invoice_advance', 'invoice_final']),
        with: {
            montage: {
                columns: {
                    id: true,
                    clientName: true,
                    displayId: true,
                    status: true,
                    deletedAt: true,
                }
            },
            uploader: true,
        },
        orderBy: [desc(montageAttachments.createdAt)],
        limit: 50,
    });

    return attachments.filter(a => a.montage && !a.montage.deletedAt);
}

export async function getPendingInvoiceChecklistItems() {
    await requireUser();
    
    const items = await db.query.montageChecklistItems.findMany({
        where: or(
            // Core system invoice tasks
            inArray(montageChecklistItems.templateId, ['advance_invoice_issued', 'final_invoice_issued']),
            // Custom invoice tasks (fallback for manual entries)
            and(
                or(
                    ilike(montageChecklistItems.label, '%faktura%'),
                    ilike(montageChecklistItems.label, '%fv%'),
                    ilike(montageChecklistItems.label, '%f.v.%')
                ),
                // Exclude payment tasks from "Documents" view if they are custom
                not(ilike(montageChecklistItems.label, '%zapłacono%')),
                not(ilike(montageChecklistItems.label, '%opłacono%'))
            )
        ),
        with: {
            montage: {
                columns: {
                    id: true,
                    clientName: true,
                    displayId: true,
                    status: true,
                    deletedAt: true,
                }
            },
            attachment: true
        },
        orderBy: [desc(montageChecklistItems.createdAt)]
    });

    // Filter out items from deleted montages
    return items.filter(item => item.montage && !item.montage.deletedAt);
}
