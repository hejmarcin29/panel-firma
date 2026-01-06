'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages, montageStatuses } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getBrokenMontages() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    // Pobierz wszystkie montaże (bez usuniętych)
    const allMontages = await db.query.montages.findMany({
        where: isNull(montages.deletedAt),
        with: {
            customer: true,
        },
        limit: 1000,
    });

    // Filtruj w JS, bo SQL może mieć problem z porównaniem enum vs text jeśli typy się nie zgadzają,
    // a status jest text w bazie, ale w kodzie mamy listę valid values.
    const brokenMontages = allMontages.filter(m => {
        return !montageStatuses.includes(m.status as any);
    });

    return brokenMontages;
}

export async function fixMontageStatus(montageId: string, newStatus: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    // @ts-expect-error - sprawdzamy string vs enum array
    if (!montageStatuses.includes(newStatus)) {
        throw new Error('Nieprawidłowy status docelowy');
    }

    await db.update(montages)
        // @ts-expect-error - nadpisujemy typ pola ograniczony enumem
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(montages.id, montageId));

    revalidatePath('/dashboard/settings/fixing');
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}
