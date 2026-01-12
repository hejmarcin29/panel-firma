'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages, settlements, users } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function getInstallerMontages() {
    const user = await requireUser();
    
    // Fetch montages where installerId is user.id OR measurerID is user.id
    return db.query.montages.findMany({
        where: or(
            eq(montages.installerId, user.id),
            eq(montages.measurerId, user.id)
        ),
        orderBy: [desc(montages.scheduledInstallationAt)],
    });
}

export async function getInstallerSettlements() {
    const user = await requireUser();
    
    return db.query.settlements.findMany({
        where: eq(settlements.installerId, user.id),
        orderBy: [desc(settlements.createdAt)],
    });
}

export async function getInstallerProfile() {
    const user = await requireUser();
    
    return db.query.users.findFirst({
        where: eq(users.id, user.id),
    });
}
