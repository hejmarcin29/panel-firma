'use server';

import { eq, or, isNotNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { customers, montages } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';

export type MagicLinkItem = {
    id: string; // montageId or customerId
    type: 'montage' | 'customer';
    name: string;
    token: string;
    url: string;
    context: string; // e.g. "Montaż: [Adres]" or "Klient"
};

export async function getMagicLinks(): Promise<MagicLinkItem[]> {
    await requireUser();

    // 1. Get Montages with accessToken
    const montagesWithToken = await db.query.montages.findMany({
        where: isNotNull(montages.accessToken),
        columns: {
            id: true,
            clientName: true,
            accessToken: true,
            installationAddress: true,
            installationCity: true,
        },
    });

    // 2. Get Customers with referralToken
    const customersWithToken = await db.query.customers.findMany({
        where: isNotNull(customers.referralToken),
        columns: {
            id: true,
            name: true,
            referralToken: true,
            email: true,
        },
    });

    const items: MagicLinkItem[] = [];

    for (const m of montagesWithToken) {
        if (m.accessToken) {
            items.push({
                id: m.id,
                type: 'montage',
                name: m.clientName,
                token: m.accessToken,
                url: `/montaz/${m.accessToken}`,
                context: `${m.installationAddress || ''} ${m.installationCity || ''}`.trim() || 'Montaż bez adresu',
            });
        }
    }

    for (const c of customersWithToken) {
        if (c.referralToken) {
            items.push({
                id: c.id,
                type: 'customer',
                name: c.name,
                token: c.referralToken,
                url: `/s/${c.referralToken}`,
                context: c.email || 'Klient',
            });
        }
    }

    return items;
}

export async function revokeMagicLink(id: string, type: 'montage' | 'customer') {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    if (type === 'montage') {
        await db.update(montages)
            .set({ accessToken: null })
            .where(eq(montages.id, id));
    } else {
        await db.update(customers)
            .set({ referralToken: null })
            .where(eq(customers.id, id));
    }

    revalidatePath('/dashboard/settings');
}

export async function revokeAllMagicLinks(type?: 'montage' | 'customer') {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    if (!type || type === 'montage') {
        await db.update(montages)
            .set({ accessToken: null })
            .where(isNotNull(montages.accessToken));
    }

    if (!type || type === 'customer') {
        await db.update(customers)
            .set({ referralToken: null })
            .where(isNotNull(customers.referralToken));
    }

    revalidatePath('/dashboard/settings');
}
