'use server';

import { db } from '@/lib/db';
import { documents, documentEvents, montages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { uploadMontageDocument } from '@/lib/r2/storage';
import { requireUser } from '@/lib/auth/session';

export async function uploadMontageProforma(montageId: string, formData: FormData) {
    await requireUser();
    const file = formData.get('file') as File;
    const proformaNumber = formData.get('proformaNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!proformaNumber) throw new Error('No proforma number provided');

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { displayId: true, id: true } 
    });
    
    if (!montage) throw new Error('Montage not found');

    const folderName = montage.displayId || montage.id;

    const pdfUrl = await uploadMontageDocument({
        montageNumber: folderName,
        file,
        type: 'proforma'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        montageId: montageId,
        type: 'proforma',
        status: 'issued',
        number: proformaNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    await db.insert(documentEvents).values({
        id: randomUUID(),
        documentId: docId,
        status: 'issued',
        note: `Uploaded manually by user. File: ${file.name}`,
    });

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return { success: true };
}


export async function uploadMontageFinalInvoice(montageId: string, formData: FormData) {
    await requireUser();
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { displayId: true, id: true } 
    });
    if (!montage) throw new Error('Montage not found');

    const folderName = montage.displayId || montage.id;

    const pdfUrl = await uploadMontageDocument({
        montageNumber: folderName,
        file,
        type: 'faktura'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        montageId: montageId,
        type: 'final_invoice',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

     revalidatePath(`/dashboard/crm/montaze/${montageId}`);
     return { success: true };
}

export async function uploadMontageAdvanceInvoice(montageId: string, formData: FormData) {
    await requireUser();
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { displayId: true, id: true } 
    });
    if (!montage) throw new Error('Montage not found');

    const folderName = montage.displayId || montage.id;

    const pdfUrl = await uploadMontageDocument({
        montageNumber: folderName,
        file,
        type: 'zaliczka'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        montageId: montageId,
        type: 'advance_invoice',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

     revalidatePath(`/dashboard/crm/montaze/${montageId}`);
     return { success: true };
}

export async function uploadMontageCorrectionInvoice(montageId: string, formData: FormData) {
    await requireUser();
    const file = formData.get('file') as File;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!file) throw new Error('No file provided');
    if (!invoiceNumber) throw new Error('No invoice number provided');

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { displayId: true, id: true } 
    });
    if (!montage) throw new Error('Montage not found');

    const folderName = montage.displayId || montage.id;

    const pdfUrl = await uploadMontageDocument({
        montageNumber: folderName,
        file,
        type: 'korekta'
    });

    const docId = randomUUID();
    await db.insert(documents).values({
        id: docId,
        montageId: montageId,
        type: 'correction',
        status: 'issued',
        number: invoiceNumber,
        pdfUrl: pdfUrl,
        issueDate: new Date(),
    });

    await db.insert(documentEvents).values({
        id: randomUUID(),
        documentId: docId,
        status: 'issued',
        note: `Correction uploaded manually. File: ${file.name}`,
    });

     revalidatePath(`/dashboard/crm/montaze/${montageId}`);
     return { success: true };
}

export async function deleteDocument(documentId: string, montageId?: string) {
    await requireUser();
    
    // Fetch to know what to revalidate (or verify)
    const doc = await db.query.documents.findFirst({
        where: eq(documents.id, documentId),
        columns: { montageId: true }
    });

    if (doc) {
        await db.delete(documents).where(eq(documents.id, documentId));
        const idToRevalidate = montageId || doc.montageId;
        if (idToRevalidate) {
             revalidatePath(`/dashboard/crm/montaze/${idToRevalidate}`);
        }
    }
}
