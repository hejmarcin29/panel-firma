'use server';

import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { desc, not, eq, isNull, and } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export async function getTvData(): Promise<Montage[]> {
    await requireUser();

    // Fetch all active montages + recently completed
    // We need full data for the process engine
    const allMontages = await db.query.montages.findMany({
        where: and(
            not(eq(montages.status, 'completed')), // We filter completed later or show them differently
            isNull(montages.deletedAt)
        ),
        with: {
            installer: true,
            measurer: true,
            checklistItems: true,
            quotes: true,
            notes: true,
            tasks: true,
            attachments: true,
            customer: true,
        },
        orderBy: [desc(montages.updatedAt)],
    });

    // Cast to Montage type (drizzle types are slightly different but compatible for our usage)
    return allMontages as unknown as Montage[];
}
