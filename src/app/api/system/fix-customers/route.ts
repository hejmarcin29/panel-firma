
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

            let finalCustomerId: string | null = null;
            let action = 'created';

            // 1. Check if customer already exists by email
            if (montage.contactEmail) {
                const existingByEmail = await db.query.customers.findFirst({
                    where: (table, { eq }) => eq(table.email, montage.contactEmail!),
                });
                if (existingByEmail) {
                    finalCustomerId = existingByEmail.id;
                    action = 'linked_by_email';
                }
            }

            // 2. Check if customer already exists by phone (if not found by email)
            if (!finalCustomerId && montage.contactPhone) {
                const existingByPhone = await db.query.customers.findFirst({
                    where: (table, { eq }) => eq(table.phone, montage.contactPhone!),
                });
                if (existingByPhone) {
                    finalCustomerId = existingByPhone.id;
                    action = 'linked_by_phone';
                }
            }

            // 3. If still not found, create new customer
            if (!finalCustomerId) {
                const newCustomerId = randomUUID();
                const now = new Date();
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
                finalCustomerId = newCustomerId;
            }

            // Update montage
            await db.update(montages)
                .set({ customerId: finalCustomerId })
                .where(eq(montages.id, montage.id));
            
            results.push(`${action} customer ${finalCustomerId} for montage ${montage.id}`);
        }

        return NextResponse.json({ success: true, fixed: results.length, details: results });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
