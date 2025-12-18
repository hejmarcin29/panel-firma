'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { partnerPayouts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadPartnerInvoice } from '@/lib/r2/storage';

export async function requestPayout(formData: FormData) {
    const user = await requireUser();
    
    if (!user.roles.includes('partner')) {
        throw new Error('Brak uprawnień.');
    }

    const amount = parseFloat(formData.get('amount') as string);
    const file = formData.get('invoice') as File;

    if (!amount || amount <= 0) {
        throw new Error('Podaj poprawną kwotę.');
    }

    if (!file) {
        throw new Error('Załącz fakturę.');
    }

    const invoiceUrl = await uploadPartnerInvoice({
        partnerId: user.id,
        file,
    });

    await db.insert(partnerPayouts).values({
        id: crypto.randomUUID(),
        partnerId: user.id,
        amount: Math.round(amount * 100), // Store in grosze
        status: 'pending',
        invoiceUrl,
        createdAt: new Date(),
    });

    revalidatePath('/dashboard/partner');
    return { success: true };
}

export async function acceptTerms() {
    const user = await requireUser();
    
    if (!user.roles.includes('partner')) {
        throw new Error('Brak uprawnień.');
    }

    const currentProfile = user.partnerProfile || {};

    await db.update(users)
        .set({
            partnerProfile: {
                ...currentProfile,
                termsAcceptedAt: new Date().toISOString(),
                termsVersion: '1.0',
            },
            updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    revalidatePath('/dashboard/partner');
}
