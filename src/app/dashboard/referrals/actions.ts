'use server';

import { db } from '@/lib/db';
import { payoutRequests, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { logSystemEvent } from '@/lib/logging';

export async function getPayoutRequests() {
    await requireUser();
    
    return await db.query.payoutRequests.findMany({
        orderBy: [desc(payoutRequests.createdAt)],
        with: {
            customer: true
        }
    });
}

export async function completePayoutRequest(id: string, note?: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    await db.update(payoutRequests)
        .set({ 
            status: 'completed', 
            completedAt: new Date(),
            note: note,
            updatedAt: new Date()
        })
        .where(eq(payoutRequests.id, id));

    await logSystemEvent('complete_payout', `Zrealizowano wypłatę ${id}`, user.id);
    revalidatePath('/dashboard/referrals');
}

export async function rejectPayoutRequest(id: string, reason?: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    // We need to refund the balance to the customer
    const request = await db.query.payoutRequests.findFirst({
        where: eq(payoutRequests.id, id)
    });

    if (!request) throw new Error('Request not found');

    await db.transaction(async (tx) => {
        await tx.update(payoutRequests)
            .set({ 
                status: 'rejected', 
                note: reason,
                updatedAt: new Date()
            })
            .where(eq(payoutRequests.id, id));

        const customer = await tx.query.customers.findFirst({
            where: eq(customers.id, request.customerId)
        });

        if (customer) {
            await tx.update(customers)
                .set({ referralBalance: (customer.referralBalance || 0) + request.amount })
                .where(eq(customers.id, request.customerId));
        }
    });

    await logSystemEvent('reject_payout', `Odrzucono wypłatę ${id}`, user.id);
    revalidatePath('/dashboard/referrals');
}
