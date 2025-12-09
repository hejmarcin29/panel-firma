'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import type { TechnicalAuditData, MaterialLogData } from './technical-data';

export async function updateTechnicalAudit(montageId: string, data: TechnicalAuditData) {
    await requireUser();
    
    await db.update(montages)
        .set({ technicalAudit: data })
        .where(eq(montages.id, montageId));

    revalidatePath(`/dashboard/montaze/${montageId}`);
}

export async function updateMaterialLog(montageId: string, data: MaterialLogData) {
    await requireUser();
    
    await db.update(montages)
        .set({ materialLog: data })
        .where(eq(montages.id, montageId));

    revalidatePath(`/dashboard/montaze/${montageId}`);
}
