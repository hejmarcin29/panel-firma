'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { montages, montageChecklistItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createR2Client } from '@/lib/r2/client';
import { getR2Config } from '@/lib/r2/config';
import { MONTAGE_ROOT_PREFIX } from '@/lib/r2/constants';
import { renderToStream } from '@react-pdf/renderer';
import { ProtocolDocument } from '@/components/documents/protocol-pdf';
import { format } from 'date-fns';
import { isSystemAutomationEnabled } from '@/lib/montaze/automation';
// import { sendEmail } from '@/lib/email'; // Placeholder if email exists

export async function uploadSignature(montageId: string, base64Data: string, type: 'client' | 'installer') {
    try {
        const config = await getR2Config();
        const client = createR2Client(config);

        // Remove header (e.g., "data:image/png;base64,")
        const base64Image = base64Data.split(';base64,').pop();
        if (!base64Image) throw new Error('Invalid base64 data');

        const buffer = Buffer.from(base64Image, 'base64');
        const key = `${MONTAGE_ROOT_PREFIX}/${montageId}/signatures/${type}_${Date.now()}.png`;

        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: buffer,
            ContentType: 'image/png',
        });

        await client.send(command);

        // Return the public URL (assuming public access or handled via proxy)
        // For R2, it's usually https://<public_url>/<key>
        // If you use a custom domain, adjust accordingly.
        // Here I'll assume a standard pattern or return the key if you handle URLs differently.
        // Based on typical setup:
        const publicUrl = `${config.publicBaseUrl}/${key}`;
        return publicUrl;
    } catch (error) {
        console.error('Error uploading signature:', error);
        throw new Error('Failed to upload signature');
    }
}

export async function submitMontageProtocol(data: {
    montageId: string;
    contractNumber: string;
    contractDate: Date | null;
    isHousingVat: boolean;
    location: string;
    notes: string;
    clientSignatureUrl: string;
    installerSignatureUrl: string;
    clientName: string;
    installerName: string;
}) {
    try {
        const isAutoStatusEnabled = await isSystemAutomationEnabled('auto_status_protocol');

        // Check current status to avoid regression if already completed
        const currentMontage = await db.query.montages.findFirst({
            where: eq(montages.id, data.montageId),
            columns: { status: true }
        });

        const shouldUpdateStatus = isAutoStatusEnabled && currentMontage?.status !== 'completed';

        // 1. Update Montage Record
        await db.update(montages).set({
            contractNumber: data.contractNumber,
            contractDate: data.contractDate,
            protocolStatus: 'signed',
            protocolData: {
                isHousingVat: data.isHousingVat,
                location: data.location,
                signedAt: new Date().toISOString(),
                notes: data.notes,
            },
            clientSignatureUrl: data.clientSignatureUrl,
            installerSignatureUrl: data.installerSignatureUrl,
            ...(shouldUpdateStatus ? { status: 'before_final_invoice' } : {}), // Move to next stage automatically if enabled, but don't revert completed
        }).where(eq(montages.id, data.montageId));

        // 2. Generate PDF
        const config = await getR2Config();
        const client = createR2Client(config);
        
        const pdfStream = await renderToStream(
            ProtocolDocument({
                montageId: data.montageId,
                contractNumber: data.contractNumber,
                contractDate: data.contractDate ? format(data.contractDate, 'dd.MM.yyyy') : '',
                clientName: data.clientName,
                installerName: data.installerName,
                location: data.location,
                date: format(new Date(), 'dd.MM.yyyy'),
                isHousingVat: data.isHousingVat,
                clientSignatureUrl: data.clientSignatureUrl,
                installerSignatureUrl: data.installerSignatureUrl,
            })
        );

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of pdfStream) {
            chunks.push(Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);

        const pdfKey = `${MONTAGE_ROOT_PREFIX}/${data.montageId}/documents/protokol_odbioru_${Date.now()}.pdf`;
        
        await client.send(new PutObjectCommand({
            Bucket: config.bucketName,
            Key: pdfKey,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
        }));

        const pdfUrl = `${config.publicBaseUrl}/${pdfKey}`;

import { toggleMontageChecklistItem } from './actions';

// ... existing code ...

        // 3. Update Checklist (Auto-check "protocol_signed")
        // Find the checklist item with templateId 'protocol_signed'
        const checklistItem = await db.query.montageChecklistItems.findFirst({
            where: and(
                eq(montageChecklistItems.montageId, data.montageId),
                eq(montageChecklistItems.templateId, 'protocol_signed')
            )
        });

        if (checklistItem) {
            // Use the shared action to ensure "Auto-Next" logic is triggered
            await toggleMontageChecklistItem({
                itemId: checklistItem.id,
                montageId: data.montageId,
                completed: true
            });
        }

        // 4. Send Notifications (SMS/Email)
        // TODO: Implement Email sending with attachment
        // await sendEmail(...)
        
        // Send SMS confirmation
        // await sendSms(clientPhone, `Dziękujemy za odbiór prac. Protokół został wysłany na Twój adres email.`);

        revalidatePath(`/dashboard/crm/montaze/${data.montageId}`);
        return { success: true, pdfUrl };

    } catch (error) {
        console.error('Error submitting protocol:', error);
        return { success: false, error: 'Failed to submit protocol' };
    }
}


