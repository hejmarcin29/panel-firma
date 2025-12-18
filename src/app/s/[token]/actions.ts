'use server';

import { db } from '@/lib/db';
import { customers, montages } from '@/lib/db/schema';
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
            }
        }
    });

    return customer;
}


