'use server';

import { asc, desc, sql, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    montagePayments,
    systemLogs,
    quotes,
    customers,
    montages,
    users,
    type MontageStatus
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { mapMontageRow, type MontageRow } from '../utils';
import { uploadMontageObject, uploadShipmentLabel } from '@/lib/r2/storage';
import { logSystemEvent } from '@/lib/logging';
import { createShipment, getShipmentLabel } from '@/lib/inpost/client';
import type { CreateShipmentRequest, InPostReceiver } from '@/lib/inpost/types';


export async function getMontageDetails(montageId: string) {
    const user = await requireUser();

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
        }
    });
    
    const installers = allUsers.filter(u => u.roles?.includes('installer') || u.roles?.includes('admin'));
    const measurers = installers;
    const architects = allUsers.filter(u => u.roles?.includes('architect'));

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusOptions = statusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

    const montageRow = await db.query.montages.findFirst({
        where: (table, { eq }) => eq(table.id, montageId),
        with: {
            notes: {
                orderBy: desc(montageNotes.createdAt),
                with: {
                    author: true,
                    attachments: {
                        orderBy: desc(montageAttachments.createdAt),
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            tasks: {
                orderBy: asc(montageTasks.createdAt),
                with: {
                    attachments: true,
                },
            },
            checklistItems: {
                orderBy: asc(montageChecklistItems.orderIndex),
                with: {
                    attachment: {
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            attachments: {
                orderBy: desc(montageAttachments.createdAt),
                with: {
                    uploader: true,
                },
            },
            installer: true,
            measurer: true,
            architect: true,
            customer: true,
            quotes: {
                where: isNull(quotes.deletedAt),
                orderBy: desc(quotes.createdAt),
            },
            payments: {
                orderBy: desc(montagePayments.createdAt),
            },
            settlement: true,
        },
    });

    if (!montageRow) {
        return null;
    }

    // Security check for installers
    const isInstaller = user.roles.includes('installer') && !user.roles.includes('admin');
    if (isInstaller) {
        const isAssigned = montageRow.installerId === user.id || montageRow.measurerId === user.id;
        if (!isAssigned) {
            throw new Error('Unauthorized access to montage details');
        }
    }

    const logs = await db
        .select()
        .from(systemLogs)
        .where(sql`${systemLogs.details} LIKE ${`%${montageId}%`}`)
        .orderBy(desc(systemLogs.createdAt));

    const montage = mapMontageRow(montageRow as MontageRow, publicBaseUrl);

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: {
            googleRefreshToken: true,
        }
    });
    const hasGoogleCalendar = !!currentUser?.googleRefreshToken;

    return {
        montage,
        logs,
        installers,
        measurers,
        architects,
        statusOptions,
        userRoles: user.roles,
        userId: user.id,
        hasGoogleCalendar,
    };
}

export type MontageDetailsData = Awaited<ReturnType<typeof getMontageDetails>>;

export async function generateCustomerToken(montageId: string) {
    await requireUser();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        with: {
            customer: true,
        }
    });

    if (!montage) {
        throw new Error('Nie znaleziono montażu');
    }

    let customerId = montage.customerId;

    // Self-healing: Create customer if missing
    if (!customerId) {
        customerId = randomUUID();
        await db.insert(customers).values({
            id: customerId,
            name: montage.clientName,
            phone: montage.contactPhone,
            email: montage.contactEmail,
            billingCity: montage.billingCity,
            billingPostalCode: montage.billingPostalCode,
            billingStreet: montage.billingAddress,
            shippingCity: montage.installationCity,
            shippingPostalCode: montage.installationPostalCode,
            shippingStreet: montage.installationAddress,
            source: 'other',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await db.update(montages)
            .set({ customerId })
            .where(eq(montages.id, montageId));
    }

    // Ensure montage has access token
    if (!montage.accessToken) {
        await db.update(montages)
            .set({ accessToken: randomUUID() })
            .where(eq(montages.id, montageId));
    }

    let token = montage.customer?.referralToken;

    if (!token) {
        token = randomUUID();
        await db.update(customers)
            .set({ referralToken: token })
            .where(eq(customers.id, customerId));
    }

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return token;
}

export async function updateMontageStatus(montageId: string, newStatus: MontageStatus) {
    const user = await requireUser();

    // Check requirements
    const stepDef = PROCESS_STEPS.find(s => s.relatedStatuses.includes(newStatus));
    if (stepDef?.requiredDocuments && stepDef.requiredDocuments.length > 0) {
        const attachments = await db.query.montageAttachments.findMany({
            where: (table, { eq }) => eq(table.montageId, montageId),
        });

        const docLabels: Record<string, string> = {
            'proforma': 'Faktura Proforma',
            'invoice_advance': 'Faktura Zaliczkowa',
            'invoice_final': 'Faktura Końcowa'
        };

        for (const reqDoc of stepDef.requiredDocuments) {
            const hasDoc = attachments.some(a => a.type === reqDoc);
            if (!hasDoc) {
                throw new Error(`Wymagany dokument: ${docLabels[reqDoc] || reqDoc} nie został wgrany.`);
            }
        }
    }
    
    await db.update(montages)
        .set({ status: newStatus })
        .where(eq(montages.id, montageId));

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusLabel = statusDefinitions.find(d => d.id === newStatus)?.label || newStatus;
    await logSystemEvent('update_montage_status', `Zmiana statusu na: ${statusLabel}`, user.id);

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

export async function createPayment(montageId: string, data: {
    name: string;
    amount: number;
    invoiceNumber: string;
    proformaUrl?: string;
    invoiceUrl?: string;
    status?: 'pending' | 'paid';
    type: 'advance' | 'final' | 'other';
}) {
    const user = await requireUser();

    const paymentId = randomUUID();

    await db.insert(montagePayments).values({
        id: paymentId,
        montageId,
        name: data.name,
        amount: data.amount.toString(),
        invoiceNumber: data.invoiceNumber,
        proformaUrl: data.proformaUrl,
        invoiceUrl: data.invoiceUrl,
        status: data.status || 'pending',
        paidAt: data.status === 'paid' ? new Date() : null,
        type: data.type,
    });

    await logSystemEvent('create_payment', `Utworzono płatność: ${data.name} (${data.amount} PLN)`, user.id);

    // If we have files, we should also add them to the main attachments list for visibility
    if (data.proformaUrl) {
        await db.insert(montageAttachments).values({
            id: randomUUID(),
            montageId,
            type: 'proforma',
            title: `Proforma - ${data.name}`,
            url: data.proformaUrl,
            uploadedBy: null, // System action
        });
    }

    if (data.invoiceUrl) {
        const attachmentType = data.type === 'final' ? 'invoice_final' : 'invoice_advance';
        await db.insert(montageAttachments).values({
            id: randomUUID(),
            montageId,
            type: attachmentType,
            title: `Faktura - ${data.name}`,
            url: data.invoiceUrl,
            uploadedBy: null, // System action
        });
    }

    // Auto-update status logic for paid advance
    if (data.type === 'advance' && data.status === 'paid') {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            columns: { status: true }
        });

        if (montage?.status === 'waiting_for_deposit' || montage?.status === 'contract_signed') {
            await db.update(montages)
                .set({ status: 'deposit_paid' })
                .where(eq(montages.id, montageId));
        }
    }
    // Auto-update status if it's an Advance payment (PENDING)
    else if (data.type === 'advance') {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            columns: { status: true }
        });

        if (montage?.status === 'contract_signed') {
            await db.update(montages)
                .set({ status: 'waiting_for_deposit' })
                .where(eq(montages.id, montageId));
        }
    }

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return { success: true };
}

export async function markPaymentAsPaid(paymentId: string, data: {
    invoiceUrl?: string;
}) {
    const user = await requireUser();

    const payment = await db.query.montagePayments.findFirst({
        where: eq(montagePayments.id, paymentId),
    });

    if (!payment) throw new Error('Płatność nie znaleziona');

    await db.update(montagePayments)
        .set({
            status: 'paid',
            paidAt: new Date(),
            invoiceUrl: data.invoiceUrl,
        })
        .where(eq(montagePayments.id, paymentId));

    await logSystemEvent('mark_payment_paid', `Oznaczono płatność jako opłaconą: ${payment.name} (${payment.amount} PLN)`, user.id);

    // Auto-update status logic
    // If status is 'waiting_for_deposit' AND it is an ADVANCE payment, move to 'deposit_paid'
    if (payment.type === 'advance') {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, payment.montageId),
            columns: { status: true }
        });

        if (montage?.status === 'waiting_for_deposit') {
            await db.update(montages)
                .set({ status: 'deposit_paid' })
                .where(eq(montages.id, payment.montageId));
        }
    }

    revalidatePath(`/dashboard/crm/montaze/${payment.montageId}`);
    return { success: true };
}

export async function deletePayment(paymentId: string) {
    const user = await requireUser();
    
    const payment = await db.query.montagePayments.findFirst({
        where: eq(montagePayments.id, paymentId),
    });
    
    if (!payment) return;

    await db.delete(montagePayments).where(eq(montagePayments.id, paymentId));
    
    await logSystemEvent('delete_payment', `Usunięto płatność: ${payment.name} (${payment.amount} PLN)`, user.id);

    revalidatePath(`/dashboard/crm/montaze/${payment.montageId}`);
    return { success: true };
}

export async function addMontageAttachment(formData: FormData) {
    const user = await requireUser();
    const file = formData.get('file') as File;
    const montageId = formData.get('montageId') as string;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;

    if (!file || !montageId) throw new Error('Missing file or montageId');

    const { url } = await uploadMontageObject({
        clientName: 'unknown',
        montageId,
        file: file,
        category: category || 'documents'
    });

    await db.insert(montageAttachments).values({
        id: randomUUID(),
        montageId,
        type: category === 'proforma' ? 'proforma' : (category === 'invoice_final' ? 'invoice_final' : 'general'),
        title: title || file.name,
        url: url,
        uploadedBy: user.id,
    });

    await logSystemEvent('add_attachment', `Dodano załącznik: ${title || file.name}`, user.id);

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return { success: true, url };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateInPostLabel(montageId: string, deliveryData: any) {
    const user = await requireUser();

    // Fetch montage to verify/get email/phone
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        with: { customer: true }
    });

    if (!montage) throw new Error('Montaż nie istnieje');

    // Priority: deliveryData form > montage/customer data
    const email = montage.contactEmail || montage.customer?.email || 'nieznany@klient.pl';
    const phone = montage.contactPhone || montage.customer?.phone || '000000000';
    
    // Parse deliveryData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delivery = deliveryData || (montage.sampleDelivery as any);
    
    if (!delivery) throw new Error("Brak danych dostawy");

    // Construct Payload
    const receiver: InPostReceiver = {
        email: email,
        phone: phone.replace(/\s+/g, '').replace(/-/g, '').substring(0, 9), // simple cleanup
    };

    let service: 'inpost_locker_standard' | 'inpost_courier_standard' = 'inpost_locker_standard';
    let targetPoint = '';

    if (delivery.pointName) {
         // Paczkomat
         service = 'inpost_locker_standard';
         targetPoint = delivery.pointName;
    } else {
         // Courier
         service = 'inpost_courier_standard';
         // ShipX requires address for courier
         receiver.address = {
             street: delivery.street || montage.installationAddress || 'Ulica',
             building_number: delivery.buildingNumber || '1',
             city: delivery.city || montage.installationCity || 'Miasto',
             post_code: delivery.postCode || montage.installationPostalCode || '00-000',
             country_code: 'PL'
         };
    }

    const payload: CreateShipmentRequest = {
        receiver,
        parcels: [{
            template: 'small', // Default to small for samples
        }],
        service: service,
        reference: `Montaż ${montage.clientName}`,
        comments: `Próbki dla ${montage.clientName}`
    };

    if (targetPoint) {
        payload.custom_attributes = {
            target_point: targetPoint
        };
    }

    // Call InPost
    const shipment = await createShipment(payload);

    // Get Label
    // We try immediately. With ShipX specific logic, sometimes you need to wait, but usually instant for wrappers.
    let pdfBuffer: ArrayBuffer;
    try {
        pdfBuffer = await getShipmentLabel(shipment.id);
    } catch (e) {
        throw new Error(`Przesyłka ${shipment.id} utworzona, ale błąd etykiety: ${(e as Error).message}`);
    }

    // Upload to R2
    const fileName = `Etykieta_${shipment.tracking_number}.pdf`;
    const labelUrl = await uploadShipmentLabel({
        fileBuffer: Buffer.from(pdfBuffer),
        fileName: fileName
    });

    // Update Montage with tracking info
    const updatedDelivery = {
        ...delivery,
        trackingNumber: shipment.tracking_number,
        labelUrl: labelUrl,
        shipmentId: shipment.id
    };

    await db.update(montages).set({
        sampleDelivery: updatedDelivery,
        sampleStatus: 'sent'
    }).where(eq(montages.id, montage.id));
    
    // Add Note
    await db.insert(montageNotes).values({
        id: randomUUID(),
        montageId: montage.id,
        content: `Wygenerowano etykietę InPost (${shipment.tracking_number}). [Pobierz Etykietę](${labelUrl})`,
        createdBy: user.id,
    });
    
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);

    return { success: true, labelUrl, trackingNumber: shipment.tracking_number };
}


