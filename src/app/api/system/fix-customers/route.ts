
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { montages, customers } from '@/lib/db/schema';
import { isNull, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { generatePortalToken } from '@/lib/utils';

export async function GET() {
    try {
        console.log('Checking for montages without customers...');
        const orphanedMontages = await db.query.montages.findMany({
            where: isNull(montages.customerId),
        });

        console.log(`Found ${orphanedMontages.length} montages without customer.`);
        const results = [];

        for (const montage of orphanedMontages) {
            console.log(`Fixing montage: ${montage.clientName} (${montage.id})`);

            // Create new customer
            const newCustomerId = randomUUID();
            const now = new Date();

            // Try to extract name parts if possible, or just use clientName
            const name = montage.clientName || 'Nieznany Klient';

            await db.insert(customers).values({
                id: newCustomerId,
                name: name,
                email: montage.contactEmail,
                phone: montage.contactPhone,
                billingStreet: montage.billingAddress,
                billingCity: montage.billingCity,
                billingPostalCode: montage.billingPostalCode,
                shippingStreet: montage.installationAddress,
                shippingCity: montage.installationCity,
                shippingPostalCode: montage.installationPostalCode,
                taxId: montage.nip,
                createdAt: now,
                updatedAt: now,
                referralToken: generatePortalToken(),
                source: 'other'
            });

            // Update montage
            await db.update(montages)
                .set({ customerId: newCustomerId })
                .where(eq(montages.id, montage.id));
            
            results.push(`Created customer ${newCustomerId} for montage ${montage.id}`);
        }

        return NextResponse.json({ success: true, fixed: results.length, details: results });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
