'use server';

import { db } from '@/lib/db';
import { customers, montages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    if (!customer) return undefined;

    // Fallback: Find unlinked montages by email
    if (customer.email) {
        const montagesByEmail = await db.query.montages.findMany({
            where: eq(montages.contactEmail, customer.email),
            orderBy: [desc(montages.createdAt)],
            with: {
                attachments: true,
            }
        });

        const existingIds = new Set(customer.montages.map(m => m.id));
        const allMontages = [...customer.montages];

        for (const m of montagesByEmail) {
            if (!existingIds.has(m.id)) {
                allMontages.push(m);
            }
        }

        // Sort by date desc
        allMontages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return {
            ...customer,
            montages: allMontages
        };
    }

    return customer;
}


