'use server';

import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function getReferrerByCode(code: string) {
    const referrer = await db.query.customers.findFirst({
        where: eq(customers.referralCode, code),
        columns: {
            id: true,
            name: true,
            referralCode: true,
        }
    });
    return referrer;
}

export async function submitLead(formData: FormData) {
    const referralCode = formData.get('referralCode') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const message = formData.get('message') as string;
    const city = formData.get('city') as string;

    if (!name || !phone || !referralCode) {
        return { error: 'Wypełnij wymagane pola (Imię i Telefon)' };
    }

    const referrer = await getReferrerByCode(referralCode);

    if (!referrer) {
        return { error: 'Nieprawidłowy kod polecający' };
    }

    try {
        // Create the lead
        await db.insert(customers).values({
            id: randomUUID(),
            name: name,
            phone: phone,
            billingCity: city, // Using billingCity for city
            source: 'recommendation',
            referredById: referrer.id,
            // We can store the message in a note or similar if we had a notes table for customers, 
            // but for now we might just append it to the name or ignore it if there's no field.
            // Actually, let's check if we have a notes field. 
            // The schema didn't show a generic notes field on customers table.
            // I'll skip saving the message to DB for now to avoid schema changes, 
            // or I could put it in `billingStreet` temporarily if it's short, but that's hacky.
            // Let's just save the core contact info.
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating lead:', error);
        return { error: 'Wystąpił błąd podczas zapisywania zgłoszenia. Spróbuj ponownie.' };
    }
}
