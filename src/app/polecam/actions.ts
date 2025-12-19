'use server';

import { db } from '@/lib/db';
import { users, customers, montages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generatePortalToken } from '@/lib/utils';

export async function submitReferralLead(formData: FormData) {
    const token = formData.get('token') as string;
    const clientName = formData.get('clientName') as string;
    const phone = formData.get('phone') as string;
    const city = formData.get('city') as string;
    const description = formData.get('description') as string;

    if (!token || !clientName || !phone) {
        return { error: 'Wypełnij wymagane pola.' };
    }

    // 1. Find Partner
    const partner = await db.query.users.findFirst({
        where: eq(users.referralToken, token),
    });

    if (!partner) {
        return { error: 'Nieprawidłowy kod partnera.' };
    }

    const now = new Date();
    const montageId = crypto.randomUUID();
    const customerId = crypto.randomUUID();

    // 2. Create Customer (Simplified)
    // Check if exists by phone? For simplicity, let's just create or link.
    // Reusing logic from createExtendedLead would be better but I'll keep it simple here.
    
    let finalCustomerId = customerId;
    const existingCustomer = await db.query.customers.findFirst({
        where: (table, { eq }) => eq(table.phone, phone),
    });

    if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
    } else {
        await db.insert(customers).values({
            id: customerId,
            name: clientName,
            phone: phone,
            billingCity: city,
            source: 'recommendation', // or 'partner' if I added it to enum, but 'recommendation' fits well
            referralToken: generatePortalToken(),
            createdAt: now,
            updatedAt: now,
        });
    }

    // 3. Create Montage (Lead)
    // We use architectId to store partnerId as discussed.
    
    const { generateNextMontageId } = await import('@/app/dashboard/crm/montaze/actions');
    const displayId = await generateNextMontageId();

    await db.insert(montages).values({
        id: montageId,
        displayId,
        customerId: finalCustomerId,
        clientName: clientName,
        contactPhone: phone,
        installationCity: city,
        additionalInfo: `**Partner:** ${partner.name} (${partner.email})\n${description ? `**Opis:** ${description}` : ''}`,
        status: 'lead',
        partnerId: partner.id, // Explicit partner field
        createdAt: now,
        updatedAt: now,
    });
    
    return { success: true, partnerName: partner.name };
}
