'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages, montageAttachments } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { uploadMontageObject } from '@/lib/r2/storage';
import { MontageCategories } from '@/lib/r2/constants';
import type { TechnicalAuditData, MaterialLogData } from './technical-data';
import { logSystemEvent } from '@/lib/logging';

export async function uploadAuditPhotoAction(formData: FormData) {
    const user = await requireUser();
    const montageId = formData.get('montageId') as string;
    const file = formData.get('file') as File;

    if (!montageId || !file) {
        throw new Error('Missing montageId or file');
    }

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { id: true, clientName: true, customerId: true }
    });

    if (!montage) throw new Error('Montage not found');

    const uploaded = await uploadMontageObject({
        clientName: montage.clientName,
        file,
        montageId: montage.id,
        customerId: montage.customerId,
        category: MontageCategories.GALLERY,
    });

    const attachmentId = crypto.randomUUID();
    await db.insert(montageAttachments).values({
        id: attachmentId,
        montageId: montage.id,
        title: 'Zdjęcie z audytu',
        url: uploaded.url,
        uploadedBy: user.id,
        createdAt: new Date(),
    });

    await logSystemEvent('upload_audit_photo', 'Dodano zdjęcie do audytu technicznego', user.id);

    return uploaded.url;
}

export async function updateTechnicalAudit(montageId: string, data: TechnicalAuditData) {
    const user = await requireUser();
    
    await db.update(montages)
        .set({ technicalAudit: data })
        .where(eq(montages.id, montageId));

    await logSystemEvent('update_technical_audit', 'Zaktualizowano dane audytu technicznego (Asystent Pomiaru)', user.id);

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

export async function updateMaterialLog(montageId: string, data: MaterialLogData) {
    const user = await requireUser();
    
    await db.update(montages)
        .set({ materialLog: data })
        .where(eq(montages.id, montageId));

    await logSystemEvent('update_material_log', 'Zaktualizowano dziennik materiałowy', user.id);

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}
