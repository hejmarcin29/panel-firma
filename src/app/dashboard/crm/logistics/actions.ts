'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages, type LogisticsStatus } from '@/lib/db/schema';

export async function getLogisticsMontages() {
    const data = await db.query.montages.findMany({
        where: (table, { and, ne, isNotNull }) => and(
            ne(table.status, 'cancelled'),
            isNotNull(table.scheduledInstallationAt)
        ),
        orderBy: (table, { asc }) => [asc(table.scheduledInstallationAt)],
        with: {
            installer: true,
            quotes: {
                where: isNull(quotes.deletedAt),
                orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
                limit: 1,
            }
        }
    });

    return data;
}

export async function updateLogisticsStatus(montageId: string, status: LogisticsStatus) {
    await db.update(montages)
        .set({ logisticsStatus: status })
        .where(eq(montages.id, montageId));
    
    revalidatePath('/dashboard/crm/logistics');
}

export async function updateCargoChecklist(montageId: string, itemId: string, picked: boolean) {
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { cargoChecklist: true }
    });

    if (!montage) return;

    const currentChecklist = montage.cargoChecklist || {};
    const newChecklist = {
        ...currentChecklist,
        [itemId]: { picked }
    };

    await db.update(montages)
        .set({ cargoChecklist: newChecklist })
        .where(eq(montages.id, montageId));

    revalidatePath('/dashboard/crm/logistics');
}

export async function updateLogisticsNotes(montageId: string, notes: string) {
    await db.update(montages)
        .set({ logisticsNotes: notes })
        .where(eq(montages.id, montageId));
    
    revalidatePath('/dashboard/crm/logistics');
}
