'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { 
    montages, 
    purchaseOrders, 
    purchaseOrderItems, 
    erpSuppliers, 
    quotes,
    orders,
    erpProducts
} from '@/lib/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';
import { randomUUID } from 'crypto';

export async function getERPOrdersData() {
    await requireUser();

    // 1. Zapotrzebowanie (To Order)
    const montagesToOrder = await db.query.montages.findMany({
        where: and(
            inArray(montages.status, ['deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled']),
            eq(montages.materialStatus, 'none')
        ),
        with: {
            customer: true,
            quotes: {
                where: eq(quotes.status, 'accepted'),
            }
        },
        orderBy: desc(montages.createdAt)
    });

    const shopOrdersToOrder = await db.query.orders.findMany({
        where: eq(orders.status, 'order.paid'),
        with: {
            customer: true,
            items: true
        },
        orderBy: desc(orders.createdAt)
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

    const toOrder = [
        ...montagesToOrder.map(m => ({
            id: m.id,
            type: 'montage' as const,
            clientName: m.clientName,
            createdAt: m.createdAt,
            details: m.quotes.flatMap(q => q.items.map(i => i.name)).join(', ') || 'Brak produktów',
            subDetails: `${m.floorArea} m²`,
            url: `/dashboard/crm/montaze/${m.id}`
        })),
        ...shopOrdersToOrder.map(o => ({
            id: o.id,
            type: 'shop' as const,
            clientName: o.customer?.name || 'Klient Sklepu',
            createdAt: o.createdAt,
            details: o.items.map(i => i.name).join(', ') || 'Brak produktów',
            subDetails: `${(o.totalGross / 100).toFixed(2)} PLN`,
            url: `/dashboard/shop/orders/${o.id}`
        }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
        toOrder,
        inTransit: ordersInTransit,
        ready: montagesReady,
        suppliers
    };
}

export async function createPurchaseOrder(ids: string[], supplierId: string) {
    await requireUser();

    if (!ids.length) return { success: false, error: 'No items selected' };

    const poId = randomUUID();

    // 1. Create Purchase Order
    await db.insert(purchaseOrders).values({
        id: poId,
        supplierId,
        status: 'ordered',
        orderDate: new Date(),
    });

    // 2. Add items
    for (const id of ids) {
        // A. Try Montage
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, id),
            with: {
                quotes: {
                    where: eq(quotes.status, 'accepted'),
                }
            }
        });

        if (montage) {
            if (montage.quotes.length > 0) {
                const quote = montage.quotes[0];
                for (const item of quote.items) {
                    
                    let formattedName = item.name;
                    // Secure lookup via productId if available
                    if (item.productId) {
                        const product = await db.query.erpProducts.findFirst({
                            where: eq(erpProducts.id, String(item.productId)),
                            columns: { packageSizeM2: true, name: true }
                        });

                        if (product && product.packageSizeM2 && product.packageSizeM2 > 0) {
                            // Quote Quantity is usually already m2 aligned to packs.
                            // Calculate packs count roughly
                            const packs = Math.round(item.quantity / product.packageSizeM2);
                            const totalM2 = packs * product.packageSizeM2;
                            const simpleName = product.name;
                            formattedName = `${simpleName} (${packs} op. = ${totalM2.toFixed(2)} m²)`;
                        }
                    }

                    await db.insert(purchaseOrderItems).values({
                        id: randomUUID(),
                        purchaseOrderId: poId,
                        productName: formattedName,
                        quantity: item.quantity,
                        unitPrice: item.priceNet,
                        vatRate: item.vatRate,
                        totalNet: item.totalNet,
                        totalGross: item.totalGross,
                        montageId: id,
                    });
                }
            } else {
                 await db.insert(purchaseOrderItems).values({
                    id: randomUUID(),
                    purchaseOrderId: poId,
                    productName: `Materiały do: ${montage.clientName}`,
                    quantity: 1,
                    unitPrice: 0,
                    vatRate: 23,
                    totalNet: 0,
                    totalGross: 0,
                    montageId: id,
                });
            }
            
            // 3. Update Montage Status
            if (montage.status === 'deposit_paid') {
                 await db.update(montages)
                    .set({ 
                        status: 'materials_ordered',
                        materialStatus: 'ordered'
                    })
                    .where(eq(montages.id, id));
            } else {
                 await db.update(montages)
                    .set({ 
                        materialStatus: 'ordered'
                    })
                    .where(eq(montages.id, id));
            }
            continue;
        }

        // B. Try Shop Order
        const shopOrder = await db.query.orders.findFirst({
            where: eq(orders.id, id),
            with: { items: true }
        });

        if (shopOrder) {
            for (const item of shopOrder.items) {
                // Determine totals
                let quantity = item.quantity;
                let unitPrice = item.unitPrice;
                let formattedName = item.name;

                // Secure lookup via SKU
                if (item.sku) {
                    const product = await db.query.erpProducts.findFirst({
                        where: eq(erpProducts.sku, item.sku),
                        columns: { packageSizeM2: true, name: true }
                    });

                    if (product && product.packageSizeM2 && product.packageSizeM2 > 0) {
                        const quantityPacks = item.quantity;
                        const totalM2 = quantityPacks * product.packageSizeM2;
                        
                        formattedName = `${product.name} (${quantityPacks} op. = ${totalM2.toFixed(2)} m²)`;

                        // Convert quantity to M2 for consistency with Montages
                        quantity = totalM2;
                        // Convert Price Per Pack -> Price Per M2
                        unitPrice = Math.round(item.unitPrice / product.packageSizeM2);
                    }
                }

                const totalNet = item.unitPrice * item.quantity;
                // Assuming taxRate is integer percent e.g. 2300 (23.00%) -> 23
                const taxRate = item.taxRate > 100 ? item.taxRate / 100 : item.taxRate;
                const totalGross = Math.round(totalNet * (1 + taxRate / 100));

                await db.insert(purchaseOrderItems).values({
                    id: randomUUID(),
                    purchaseOrderId: poId,
                    productName: formattedName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    vatRate: taxRate,
                    totalNet: totalNet,
                    totalGross: totalGross,
                    // montageId: null
                });
            }

            // Update status
            await db.update(orders)
                .set({ status: 'order.forwarded_to_supplier' })
                .where(eq(orders.id, id));
        }
    }

    revalidatePath('/dashboard/erp/orders');
    return { success: true, poId };
}

export async function receivePurchaseOrder(poId: string) {
    await requireUser();

    // 1. Update PO status
    await db.update(purchaseOrders)
        .set({ status: 'received' })
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
