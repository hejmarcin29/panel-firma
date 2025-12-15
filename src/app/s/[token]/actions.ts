'use server';

import { db } from '@/lib/db';
import { customers, payoutRequests, referralCommissions, montages, montageAttachments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function getCustomerByToken(token: string) {
    const customer = await db.query.customers.findFirst({
        where: eq(customers.referralToken, token),
        with: {
            montages: {
                orderBy: [desc(montages.createdAt)],
                with: {
                    attachments: true,
                }
            },
            referralCommissions: {
                orderBy: [desc(referralCommissions.createdAt)],
                with: {
                    montage: {
                        columns: {
                            clientName: true, // Or some other identifier, maybe masked
                        }
                    }
                }
            },
            payoutRequests: {
                orderBy: [desc(payoutRequests.createdAt)],
            }
        }
    });

    return customer;
}

export async function requestPayout(token: string, rewardType: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) {
        throw new Error('Nieprawidłowy token');
    }

    if ((customer.referralBalance || 0) < 5000) { // Minimum 50 PLN
        throw new Error('Minimalna kwota wypłaty to 50 PLN');
    }

    await db.transaction(async (tx) => {
        await tx.insert(payoutRequests).values({
            id: randomUUID(),
            customerId: customer.id,
            amount: customer.referralBalance || 0,
            rewardType,
            status: 'pending',
        });

        await tx.update(customers)
            .set({ referralBalance: 0 })
            .where(eq(customers.id, customer.id));
    });

    revalidatePath(`/s/${token}`);
}
