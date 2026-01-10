'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages, erpProducts, systemLogs, montageNotes } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

export async function getPublicMontage(token: string) {
    const montage = await db.query.montages.findFirst({
        where: eq(montages.accessToken, token),
        columns: {
            id: true,
            clientName: true,
            status: true,
            sampleStatus: true,
            accessToken: true,
        }
    });

    if (!montage) return null;

    return montage;
}

export async function getAvailableSamples() {
    const samples = await db.query.erpProducts.findMany({
        where: eq(erpProducts.isSample, true),
        columns: {
            id: true,
            name: true,
            sku: true,
            description: true,
            imageUrl: true,
        }
    });
    return samples;
}

export async function submitSampleRequest(
    token: string, 
    productIds: string[],
    delivery: {
        method: 'courier' | 'parcel_locker';
        recipient: {
            name: string;
            email: string;
            phone: string;
        };
        pointName?: string;
        pointAddress?: string;
        address?: {
            street: string;
            buildingNumber: string;
            city: string;
            postalCode: string;
        };
    }
) {
    // 1. Verify Token
    const montage = await getPublicMontage(token);
    if (!montage) throw new Error('Invalid token');

    // 2. Resolve Products
    const selectedProducts = await db.query.erpProducts.findMany({
        where: (table, { inArray }) => inArray(table.id, productIds)
    });

    if (selectedProducts.length === 0) throw new Error('No products selected');

    // 3. Format Note
    const sampleList = selectedProducts.map(p => `- ${p.name} (${p.sku})`).join('\n');
    
    let deliveryNote = '';
    const { method, recipient, address, pointName, pointAddress } = delivery;

    if (method === 'parcel_locker') {
        deliveryNote = `\n[DOSTAWA: PACZKOMAT]\nPunkt: ${pointName} (${pointAddress})\nDla: ${recipient.name}, ${recipient.phone}, ${recipient.email}`;
    } else {
        deliveryNote = `\n[DOSTAWA: KURIER]\nAdres: ${address?.street} ${address?.buildingNumber}, ${address?.postalCode} ${address?.city}\nDla: ${recipient.name}, ${recipient.phone}, ${recipient.email}`;
    }

    // Update Sample Delivery Info ONLY (Do not touch main client address)
    const deliveryWithProducts = {
        ...delivery,
        products: selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku ?? undefined
        }))
    };

    await db.update(montages)
        .set({
            status: 'lead_samples_pending',
            sampleStatus: 'to_send',
            sampleDelivery: deliveryWithProducts,
            updatedAt: new Date()
        })
        .where(eq(montages.id, montage.id));

    // Add explicit note to timeline
    await db.insert(montageNotes).values({
        id: randomUUID(),
        montageId: montage.id,
        content: `[ZAMÓWIENIE PRÓBEK]:\n${sampleList}${deliveryNote}`,
        isInternal: false,
        createdAt: new Date()
    });

    // Log event (system user or null)
    await db.insert(systemLogs).values({
        id: randomUUID(),
        action: 'sample_request',
        details: `Klient zamówił ${selectedProducts.length} próbek dla montażu ${montage.id} (${delivery?.method === 'parcel_locker' ? 'Paczkomat' : 'Kurier'})`,
        createdAt: new Date()
    });
    
    return { success: true };
}

