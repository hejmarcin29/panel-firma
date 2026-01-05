'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { 
    montages, 
    purchaseOrders, 
    purchaseOrderItems, 
    erpSuppliers, 
    quotes, 
    quoteItems,
    users
} from '@/lib/db/schema';
import { eq, and, inArray, desc, isNull } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';
import { randomUUID } from 'crypto';

export async function getERPOrdersData() {
    await requireUser();

    // 1. Zapotrzebowanie (To Order)
    // Montages where we should order materials.
    // Usually after deposit is paid.
    const montagesToOrder = await db.query.montages.findMany({
        where: and(
            inArray(montages.status, ['deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled']),
            eq(montages.materialStatus, 'none')
        ),
        with: {
            customer: true,
            quotes: {
                where: eq(quotes.status, 'accepted'),
                with: {
                    items: true
                }
            }
        },
        orderBy: desc(montages.createdAt)
    });

    // 2. W Drodze (In Transit)
    const ordersInTransit = await db.query.purchaseOrders.findMany({
        where: eq(purchaseOrders.status, 'ordered'),
        with: {
            supplier: true,
            items: {
                with: {
                    montage: {
                        with: {
                            customer: true
                        }
                    }
                }
            }
        },
        orderBy: desc(purchaseOrders.createdAt)
    });

    // 3. Do Wydania (Ready)
    const montagesReady = await db.query.montages.findMany({
        where: eq(montages.materialStatus, 'in_stock'),
        with: {
            customer: true,
            installer: true
        },
        orderBy: desc(montages.createdAt)
    });
    
    // Fetch suppliers for the dropdown
    const suppliers = await db.query.erpSuppliers.findMany({
        where: eq(erpSuppliers.status, 'active')
    });

    return {
        toOrder: montagesToOrder,
        inTransit: ordersInTransit,
        ready: montagesReady,
        suppliers
    };
}

export async function createPurchaseOrder(montageIds: string[], supplierId: string) {
    const user = await requireUser();

    if (!montageIds.length) return { success: false, error: 'No montages selected' };

    const poId = randomUUID();

    // 1. Create Purchase Order
    await db.insert(purchaseOrders).values({
        id: poId,
        supplierId,
        status: 'ordered',
        orderDate: new Date(),
        createdBy: user.id, // Assuming we might want to track who created it, but schema doesn't have createdBy on PO yet. It has createdAt.
        // We can add createdBy later if needed.
    });

    // 2. Add items from accepted quotes of these montages
    for (const montageId of montageIds) {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            with: {
                quotes: {
                    where: eq(quotes.status, 'accepted'),
                    with: {
                        items: true
                    }
                }
            }
        });

        if (montage && montage.quotes.length > 0) {
            const quote = montage.quotes[0]; // Take the first accepted quote
            
            for (const item of quote.items) {
                await db.insert(purchaseOrderItems).values({
                    id: randomUUID(),
                    purchaseOrderId: poId,
                    productName: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price, // Assuming price is net
                    vatRate: item.vatRate,
                    totalNet: item.amount, // Assuming amount is net total
                    totalGross: Math.round(item.amount * (1 + item.vatRate / 100)),
                    montageId: montageId,
                });
            }
        } else {
            // Fallback if no quote: Create a generic item for the montage
            await db.insert(purchaseOrderItems).values({
                id: randomUUID(),
                purchaseOrderId: poId,
                productName: `Materiały do montażu: ${montage?.clientName || montageId}`,
                quantity: 1,
                unitPrice: 0,
                vatRate: 23,
                totalNet: 0,
                totalGross: 0,
                montageId: montageId,
            });
        }

        // 3. Update Montage Status -> 'materials_ordered'
        // Only if current status allows (Guard)
        if (montage?.status === 'deposit_paid') {
             await db.update(montages)
                .set({ 
                    status: 'materials_ordered',
                    materialStatus: 'ordered'
                })
                .where(eq(montages.id, montageId));
        } else {
             // Just update material status
             await db.update(montages)
                .set({ 
                    materialStatus: 'ordered'
                })
                .where(eq(montages.id, montageId));
        }
    }

    revalidatePath('/dashboard/erp/orders');
    return { success: true, poId };
}

export async function receivePurchaseOrder(poId: string) {
    await requireUser();

    // 1. Update PO status
    await db.update(purchaseOrders)
        .set({ status: 'received' }) // 'received' is not in schema enum? schema says 'received' is ok.
        .where(eq(purchaseOrders.id, poId));

    // 2. Find affected montages
    const items = await db.query.purchaseOrderItems.findMany({
        where: eq(purchaseOrderItems.purchaseOrderId, poId),
        columns: { montageId: true }
    });

    const affectedMontageIds = [...new Set(items.map(i => i.montageId).filter(Boolean))];

    // 3. Update Montages -> 'materials_pickup_ready' / 'in_stock'
    for (const montageId of affectedMontageIds) {
        if (!montageId) continue;

        // Check if ALL items for this montage are received? 
        // For "Minimal" version, we assume if PO is received, the montage materials in it are received.
        // We don't check if there are OTHER POs for the same montage yet.
        
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            columns: { status: true }
        });

        if (montage?.status === 'materials_ordered') {
            await db.update(montages)
                .set({ 
                    status: 'materials_pickup_ready',
                    materialStatus: 'in_stock'
                })
                .where(eq(montages.id, montageId));
        } else {
             await db.update(montages)
                .set({ 
                    materialStatus: 'in_stock'
                })
                .where(eq(montages.id, montageId));
        }
    }

    revalidatePath('/dashboard/erp/orders');
    return { success: true };
}

export async function issueMaterialsToCrew(montageId: string) {
    await requireUser();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { status: true }
    });

    // Guard: Don't change status if it's already further or cancelled
    // But 'materials_delivered' is usually after 'materials_pickup_ready' or 'installation_scheduled'
    
    const allowedStatuses = ['materials_pickup_ready', 'installation_scheduled'];
    
    if (montage && allowedStatuses.includes(montage.status)) {
         await db.update(montages)
            .set({ 
                status: 'materials_delivered',
                materialStatus: 'delivered'
            })
            .where(eq(montages.id, montageId));
    } else {
        await db.update(montages)
            .set({ 
                materialStatus: 'delivered'
            })
            .where(eq(montages.id, montageId));
    }

    revalidatePath('/dashboard/erp/orders');
    return { success: true };
}
