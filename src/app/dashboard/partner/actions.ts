'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { partnerPayouts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadPartnerInvoice } from '@/lib/r2/storage';

export async function requestPayout(formData: FormData) {
    try {
        const user = await requireUser();
        
        if (!user.roles.includes('partner')) {
            return { success: false, error: 'Brak uprawnień.' };
        }

        const amount = parseFloat(formData.get('amount') as string);
        const file = formData.get('invoice') as File;

        if (!amount || amount <= 0) {
            return { success: false, error: 'Podaj poprawną kwotę.' };
        }

        if (!file) {
            return { success: false, error: 'Załącz fakturę.' };
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
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Wystąpił błąd podczas przetwarzania wypłaty.' };
    }
}

export async function acceptTerms() {
    try {
        const user = await requireUser();
        
        if (!user.roles.includes('partner')) {
            return { success: false, error: 'Brak uprawnień.' };
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });

        if (!dbUser) {
            return { success: false, error: 'Użytkownik nie istnieje.' };
        }

        const currentProfile = dbUser.partnerProfile || {};

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
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Wystąpił błąd podczas akceptacji regulaminu.' };
    }
}
