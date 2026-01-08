'use server';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages, erpProducts, systemLogs } from '@/lib/db/schema';
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
            // Add image handling if available later
        }
    });
    return samples;
}

export async function submitSampleRequest(token: string, productIds: string[]) {
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
    // Note variable removed as it was unused individually, content used in additionalInfo

    await db.update(montages)
        .set({
            status: 'lead_samples_pending',
            sampleStatus: 'to_send',
            additionalInfo: sql`${montages.additionalInfo} || '\n\n[ZAMÓWIENIE PRÓBEK ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ']:\n' || ${sampleList}`,
            updatedAt: new Date()
        })
        .where(eq(montages.id, montage.id));

    // Log event (system user or null)
    await db.insert(systemLogs).values({
        id: randomUUID(),
        action: 'sample_request',
        details: `Klient zamówił ${selectedProducts.length} próbek dla montażu ${montage.id}`,
        createdAt: new Date()
    });
    
    return { success: true };
}

