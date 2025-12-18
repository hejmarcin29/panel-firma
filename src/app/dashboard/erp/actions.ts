'use server';

import { db } from '@/lib/db';
import { suppliers, purchaseOrders, purchaseOrderItems, warehouseMovements, products, documents } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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
