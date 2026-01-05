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
import { uploadMontageObject } from '@/lib/r2/storage';

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

    const token = randomUUID();

    await db.update(customers)
        .set({ referralToken: token })
        .where(eq(customers.id, customerId));

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return token;
}

export async function updateMontageStatus(montageId: string, newStatus: MontageStatus) {
    await requireUser();

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
    await requireUser();

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

        if (montage?.status === 'waiting_for_deposit') {
            await db.update(montages)
                .set({ status: 'deposit_paid' })
                .where(eq(montages.id, montageId));
        }
    }

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

    // Auto-update status if it's an Advance payment
    // Logic: If current status is 'contract_signed', move to 'waiting_for_deposit'
    if (data.type === 'advance') {
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
    await requireUser();

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
                
            if (!data.invoiceUrl) {
                 await db.insert(montageTasks).values({
                    id: randomUUID(),
                    montageId: payment.montageId,
                    title: `Wystaw Fakturę Zaliczkową do płatności: ${payment.name}`,
                    completed: false,
                    orderIndex: 0,
                });
            }
        }
    }

    revalidatePath(`/dashboard/crm/montaze/${payment.montageId}`);
    return { success: true };
}

export async function deletePayment(paymentId: string) {
    await requireUser();
    
    const payment = await db.query.montagePayments.findFirst({
        where: eq(montagePayments.id, paymentId),
    });
    
    if (!payment) return;

    await db.delete(montagePayments).where(eq(montagePayments.id, paymentId));
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

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return { success: true, url };
}

