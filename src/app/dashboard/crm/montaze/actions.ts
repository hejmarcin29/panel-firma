'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, sql, ne, inArray, type SQL } from 'drizzle-orm';
// import { createTransport } from 'nodemailer';
import { randomUUID } from 'crypto';

import { sendNotification } from '@/lib/notifications/service';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
    montageFloorProducts,
	montageNotes,
	montageTasks,
	montages,
    settlements,
	type MontageStatus,
    type MontageMaterialStatus,
    type MontageMaterialClaimType,
    type MontageInstallerStatus,
    type MontageSampleStatus,
	montageServiceItems,
	montageStatuses,
	customers,
	users,
    commissions,
    partnerCommissions,
    // mailAccounts,
    // referralCommissions,
    type CustomerSource,
    orders,
    orderItems,
    globalSettings,
    erpProducts,
    erpCategories,
} from '@/lib/db/schema';
import { type ShopConfig } from '../../settings/shop/actions';
import { uploadMontageObject } from '@/lib/r2/storage';
import { MontageCategories, MontageSubCategories } from '@/lib/r2/constants';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';
import { DEFAULT_MONTAGE_CHECKLIST } from '@/lib/montaze/checklist-shared';
import { getMontageAutomationRules, isSystemAutomationEnabled, isProcessAutomationEnabled } from '@/lib/montaze/automation';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { logSystemEvent } from '@/lib/logging';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import type { MaterialsEditHistoryEntry } from './types';
import { 
    createGoogleCalendarEvent, 
    updateGoogleCalendarEvent, 
    deleteGoogleCalendarEvent, 
    createUserCalendarEvent, 
    updateUserCalendarEvent, 
    deleteUserCalendarEvent 
} from '@/lib/google/calendar';
import { generatePortalToken } from '@/lib/utils';
import { sendSms } from '@/lib/sms';

import { generateNextMontageId as serviceGenerateNextMontageId, createLeadCore } from '@/lib/crm/lead-service';

const MONTAGE_DASHBOARD_PATH = '/dashboard/crm/montaze';
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

export async function generateNextMontageId(): Promise<string> {
    return serviceGenerateNextMontageId();
}

async function getMontageOrThrow(montageId: string) {
	const montageRecord = await db.query.montages.findFirst({
		where: (table, { eq }) => eq(table.id, montageId),
	});

	if (!montageRecord) {
		throw new Error('Nie znaleziono montaży.');
	}

	return montageRecord;
}

function ensureValidAttachmentFile(file: File) {
	if (!(file instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	if (file.size === 0) {
		throw new Error('Plik jest pusty.');
	}

	if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
		throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 25 MB.');
	}
}

async function createMontageAttachment({
	montage,
	file,
	uploadedBy,
	title,
	noteId,
	taskId,
    category,
    type,
}: {
	montage: typeof montages.$inferSelect;
	file: File;
	uploadedBy: string;
	title: string | null;
	noteId?: string | null;
	taskId?: string | null;
    category?: string;
    type?: string;
}): Promise<string> {
	ensureValidAttachmentFile(file);

	const uploaded = await uploadMontageObject({
		clientName: montage.clientName,
		file,
        montageId: montage.id,
        customerId: montage.customerId,
        category: category || MontageCategories.GALLERY,
	});

	const now = new Date();
	const attachmentId = crypto.randomUUID();

	await db.insert(montageAttachments).values({
		id: attachmentId,
		montageId: montage.id,
		noteId: noteId ?? null,
		taskId: taskId ?? null,
		title,
		url: uploaded.url,
		uploadedBy,
		createdAt: now,
        type: type || 'general',
	});

	return attachmentId;
}

async function ensureStatus(value: string): Promise<MontageStatus> {
    const definitions = await getMontageStatusDefinitions();
    const isValid = definitions.some(d => d.id === value);
    
	if (isValid || (montageStatuses as readonly string[]).includes(value)) {
		return value as MontageStatus;
	}
	throw new Error(`Nieznany status montaży: ${value}`);
}

async function touchMontage(montageId: string) {
	await db
		.update(montages)
		.set({ updatedAt: new Date() })
		.where(eq(montages.id, montageId));
}

type CreateMontageInput = {
	clientName: string;
	contactPhone?: string;
	contactEmail?: string;
	billingAddress?: string;
	installationAddress?: string;
	billingCity?: string;
	installationCity?: string;
	billingPostalCode?: string;
	installationPostalCode?: string;
	isCompany?: boolean;
	companyName?: string;
	nip?: string;
	forecastedInstallationDate?: string;
	materialDetails?: string;
    customerUpdateStrategy?: 'update' | 'keep';
    installerId?: string;
    measurerId?: string;
    leadId?: string;
};

export type CustomerConflictData = {
    name: string | null;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    billingStreet: string | null;
    billingCity: string | null;
    billingPostalCode: string | null;
    shippingStreet: string | null;
    shippingCity: string | null;
    shippingPostalCode: string | null;
};

export type CreateMontageResult = 
    | { status: 'success'; montageId: string }
    | { status: 'conflict'; existingCustomer: CustomerConflictData; newCustomerData: CustomerConflictData };

export async function createMontage({
	clientName,
	contactPhone,
	contactEmail,
	billingAddress,
	installationAddress,
	billingCity,
	installationCity,
	billingPostalCode,
	installationPostalCode,
	isCompany,
	companyName,
	nip,
	forecastedInstallationDate,
	materialDetails,
    customerUpdateStrategy,
    installerId,
    measurerId,
    leadId,
}: CreateMontageInput): Promise<CreateMontageResult> {
	const user = await requireUser();

	const trimmedName = clientName.trim();
	if (!trimmedName) {
		throw new Error('Podaj nazwę klienta.');
	}

	const now = new Date();
	const templates = await getMontageChecklistTemplates();
	const normalizedBilling = billingAddress?.trim() ? billingAddress.trim() : null;
	const normalizedInstallation = installationAddress?.trim() ? installationAddress.trim() : null;
	const normalizedBillingCity = billingCity?.trim() ? billingCity.trim() : null;
	const normalizedInstallationCity = installationCity?.trim() ? installationCity.trim() : null;
	const normalizedBillingPostalCode = billingPostalCode?.trim() ? billingPostalCode.trim() : null;
	const normalizedInstallationPostalCode = installationPostalCode?.trim() ? installationPostalCode.trim() : null;
	const normalizedCompanyName = companyName?.trim() ? companyName.trim() : null;
	const normalizedNip = nip?.trim() ? nip.trim() : null;
	const normalizedMaterialDetails = materialDetails?.trim() ? materialDetails.trim() : null;
	const fallbackAddress = normalizedInstallation ?? normalizedBilling;
	const fallbackCity = normalizedInstallationCity ?? normalizedBillingCity;
	const fallbackAddressLine = [fallbackAddress, fallbackCity].filter(Boolean).join(', ') || null;

	const normalizedPhone = contactPhone ? normalizePhone(contactPhone) : null;
	const normalizedEmail = contactEmail?.trim()?.toLowerCase() || null;

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error('Podaj prawidłowy adres e-mail.');
    }

	// Customer sync logic
    let finalCustomerId: string | null = null;

    // Always try to find or create a customer
    {
		let existingCustomer = null;

		// 1. Try by email
		if (normalizedEmail) {
			existingCustomer = await db.query.customers.findFirst({
				where: (table, { eq }) => eq(table.email, normalizedEmail),
			});
		}

		// 2. Try by phone if not found
		if (!existingCustomer && normalizedPhone) {
			existingCustomer = await db.query.customers.findFirst({
				where: (table, { eq }) => eq(table.phone, normalizedPhone),
			});
		}

        // 3. Try by NIP if provided
        if (normalizedNip) {
            const customerWithNip = await db.query.customers.findFirst({
                where: (table, { eq }) => eq(table.taxId, normalizedNip),
            });

            if (customerWithNip) {
                if (existingCustomer && existingCustomer.id !== customerWithNip.id) {
                    throw new Error('Podany NIP jest już przypisany do innego klienta.');
                }
                if (!existingCustomer) {
                    existingCustomer = customerWithNip;
                }
            }
        }

		const customerData = {
			name: (isCompany && normalizedCompanyName) ? normalizedCompanyName : trimmedName,
			email: normalizedEmail,
			phone: normalizedPhone,
			taxId: normalizedNip,
			billingStreet: normalizedBilling,
			billingCity: normalizedBillingCity,
			billingPostalCode: normalizedBillingPostalCode,
			shippingStreet: normalizedInstallation,
			shippingCity: normalizedInstallationCity,
			shippingPostalCode: normalizedInstallationPostalCode,
			updatedAt: now,
		};

		if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
            // Check for conflicts if strategy is not provided
            if (!customerUpdateStrategy) {
                const hasConflict = 
                    (normalizedBilling && existingCustomer.billingStreet && normalizedBilling !== existingCustomer.billingStreet) ||
                    (normalizedBillingCity && existingCustomer.billingCity && normalizedBillingCity !== existingCustomer.billingCity) ||
                    (normalizedBillingPostalCode && existingCustomer.billingPostalCode && normalizedBillingPostalCode !== existingCustomer.billingPostalCode) ||
                    (normalizedInstallation && existingCustomer.shippingStreet && normalizedInstallation !== existingCustomer.shippingStreet) ||
                    (normalizedInstallationCity && existingCustomer.shippingCity && normalizedInstallationCity !== existingCustomer.shippingCity) ||
                    (normalizedInstallationPostalCode && existingCustomer.shippingPostalCode && normalizedInstallationPostalCode !== existingCustomer.shippingPostalCode) ||
                    (normalizedNip && existingCustomer.taxId && normalizedNip !== existingCustomer.taxId);

                if (hasConflict) {
                    return {
                        status: 'conflict',
                        existingCustomer: {
                            name: existingCustomer.name,
                            email: existingCustomer.email,
                            phone: existingCustomer.phone,
                            taxId: existingCustomer.taxId,
                            billingStreet: existingCustomer.billingStreet,
                            billingCity: existingCustomer.billingCity,
                            billingPostalCode: existingCustomer.billingPostalCode,
                            shippingStreet: existingCustomer.shippingStreet,
                            shippingCity: existingCustomer.shippingCity,
                            shippingPostalCode: existingCustomer.shippingPostalCode,
                        },
                        newCustomerData: customerData
                    };
                }
            }

            const shouldOverwrite = customerUpdateStrategy === 'update';
            
            const resolve = (newVal: string | null, oldVal: string | null) => {
                if (shouldOverwrite) return newVal ?? oldVal;
                return oldVal ?? newVal;
            };

			await db.update(customers)
				.set({
					email: resolve(normalizedEmail, existingCustomer.email),
                    phone: resolve(normalizedPhone, existingCustomer.phone),
					taxId: resolve(normalizedNip, existingCustomer.taxId),
					billingStreet: resolve(normalizedBilling, existingCustomer.billingStreet),
					billingCity: resolve(normalizedBillingCity, existingCustomer.billingCity),
					billingPostalCode: resolve(normalizedBillingPostalCode, existingCustomer.billingPostalCode),
					shippingStreet: resolve(normalizedInstallation, existingCustomer.shippingStreet),
					shippingCity: resolve(normalizedInstallationCity, existingCustomer.shippingCity),
					shippingPostalCode: resolve(normalizedInstallationPostalCode, existingCustomer.shippingPostalCode),
                    updatedAt: now,
				})
				.where(eq(customers.id, existingCustomer.id));
		} else {
            const newCustomerId = crypto.randomUUID();
            finalCustomerId = newCustomerId;
			await db.insert(customers).values({
				id: newCustomerId,
				...customerData,
				createdAt: now,
                referralToken: generatePortalToken(),
			});
		}
	}

	let forecastedDate: Date | null = null;
	if (forecastedInstallationDate) {
        // Use Noon UTC to avoid timezone shifting issues when displaying the date
		const parsed = new Date(`${forecastedInstallationDate}T12:00:00Z`);
		if (!Number.isNaN(parsed.getTime())) {
			forecastedDate = parsed;
		}
	}

    const finalMontageId = leadId || crypto.randomUUID();
    let finalDisplayId = '';

    if (leadId) {
        const existingLead = await db.query.montages.findFirst({
            where: eq(montages.id, leadId),
        });
        if (!existingLead) throw new Error('Lead not found');
        
        if (!existingLead.displayId) {
            finalDisplayId = await generateNextMontageId();
            await db.update(montages).set({ displayId: finalDisplayId }).where(eq(montages.id, leadId));
        } else {
            finalDisplayId = existingLead.displayId;
        }
        
        await db.update(montages).set({
            clientName: trimmedName,
            contactPhone: contactPhone?.trim() ?? null,
            contactEmail: contactEmail?.trim() ?? null,
            address: fallbackAddressLine,
            billingAddress: normalizedBilling,
            installationAddress: normalizedInstallation,
            billingCity: normalizedBillingCity,
            installationCity: normalizedInstallationCity,
            billingPostalCode: normalizedBillingPostalCode,
            installationPostalCode: normalizedInstallationPostalCode,
            isCompany: isCompany ?? false,
            companyName: normalizedCompanyName,
            nip: normalizedNip,
            forecastedInstallationDate: forecastedDate,
            installerId: installerId || null,
            measurerId: measurerId || null,
            materialDetails: normalizedMaterialDetails,
            measurementDetails: normalizedMaterialDetails,
            status: 'new_lead',
            customerId: finalCustomerId,
            updatedAt: now,
        }).where(eq(montages.id, leadId));
    } else {
        let saved = false;
        let attempts = 0;
        while (!saved && attempts < 3) {
            try {
                finalDisplayId = await generateNextMontageId();
                await db.insert(montages).values({
                    id: finalMontageId,
                    displayId: finalDisplayId,
                    clientName: trimmedName,
                    contactPhone: contactPhone?.trim() ?? null,
                    contactEmail: contactEmail?.trim() ?? null,
                    address: fallbackAddressLine,
                    billingAddress: normalizedBilling,
                    installationAddress: normalizedInstallation,
                    billingCity: normalizedBillingCity,
                    installationCity: normalizedInstallationCity,
                    billingPostalCode: normalizedBillingPostalCode,
                    installationPostalCode: normalizedInstallationPostalCode,
                    isCompany: isCompany ?? false,
                    companyName: normalizedCompanyName,
                    nip: normalizedNip,
                    scheduledInstallationAt: null,
                    scheduledInstallationEndAt: null,
                    forecastedInstallationDate: forecastedDate,
                    installerId: installerId || null,
                    measurerId: measurerId || null,
                    materialDetails: normalizedMaterialDetails,
                    measurementDetails: normalizedMaterialDetails,
                    status: 'new_lead',
                    customerId: finalCustomerId,
                    createdAt: now,
                    updatedAt: now,
                });

                // Initialize checklist items
                const checklistItems = DEFAULT_MONTAGE_CHECKLIST.map((template, index) => ({
                    id: crypto.randomUUID(),
                    montageId: finalMontageId,
                    templateId: template.id,
                    label: template.label,
                    allowAttachment: template.allowAttachment,
                    orderIndex: index,
                    completed: false,
                    createdAt: now,
                    updatedAt: now,
                }));

                if (checklistItems.length > 0) {
                    await db.insert(montageChecklistItems).values(checklistItems);
                }

                saved = true;
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                if (message.includes('UNIQUE constraint failed: montages.display_id')) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    throw e;
                }
            }
        }

        if (!saved) {
            throw new Error('Nie udało się wygenerować unikalnego numeru montażu. Spróbuj ponownie.');
        }
    }

    // Google Calendar Sync
    if (forecastedDate) {
        const attendees: { email: string }[] = [];
        if (installerId) {
            const installer = await db.query.users.findFirst({
                where: eq(users.id, installerId),
                columns: { email: true }
            });
            if (installer?.email) {
                attendees.push({ email: installer.email });
            }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
        const montageUrl = appUrl ? `${appUrl}/dashboard/crm/montaze/${finalMontageId}` : '';

        const eventId = await createGoogleCalendarEvent({
            summary: `Montaż: ${trimmedName} (${finalDisplayId})`,
            description: `Montaż dla klienta: ${trimmedName}\nTelefon: ${contactPhone || 'Brak'}\nAdres: ${fallbackAddressLine || 'Brak'}\nSzczegóły: ${normalizedMaterialDetails || 'Brak'}${montageUrl ? `\n\nLink do montażu: ${montageUrl}` : ''}`,
            location: fallbackAddressLine || '',
            start: { dateTime: forecastedDate.toISOString() },
            end: { dateTime: new Date(forecastedDate.getTime() + 60 * 60 * 1000).toISOString() }, // 1 hour default
            attendees,
        });

        if (eventId) {
            await db.update(montages).set({ googleEventId: eventId }).where(eq(montages.id, finalMontageId));
        }
    }

	if (templates.length > 0) {
        const existingItems = await db.query.montageChecklistItems.findFirst({
            where: eq(montageChecklistItems.montageId, finalMontageId),
        });

        if (!existingItems) {
            await db.insert(montageChecklistItems).values(
                templates.map((template, index) => ({
                    id: crypto.randomUUID(),
                    montageId: finalMontageId,
                    templateId: template.id,
                    label: template.label,
                    allowAttachment: template.allowAttachment,
                    completed: false,
                    orderIndex: index,
                    createdAt: now,
                    updatedAt: now,
                }))
            );
        }
	}

	await logSystemEvent('create_montage', `Utworzono/zaktualizowano montaż ${finalDisplayId} dla ${trimmedName}`, user.id);

	revalidatePath(MONTAGE_DASHBOARD_PATH);
    return { status: 'success', montageId: finalMontageId };
}

type UpdateMontageStatusInput = {
	montageId: string;
	status: MontageStatus | string;
};

export async function updateMontageStatus({ montageId, status }: UpdateMontageStatusInput) {
	const user = await requireUser();
	const resolved = await ensureStatus(status);

    const montage = await getMontageOrThrow(montageId);

    // Validation: Cannot move to 'measurement_scheduled' without assigned installer/measurer
    if (status === 'measurement_scheduled' && montage.status === 'new_lead') {
        // Validation: Legacy support for measurerId, but primary is installerId
        if (!montage.installerId && !montage.measurerId) {
             throw new Error('Aby skierować do pomiaru, musisz przypisać Opiekuna (Montażystę).');
        }
    }

    // Validation: Check required documents from PROCESS_STEPS
    const stepDef = PROCESS_STEPS.find(s => s.relatedStatuses.includes(resolved));
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

    // --- INSTALLER SETTLEMENT LOGIC (MEASUREMENT) ---
    if (resolved === 'measurement_done') {
        const montageData = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            with: { measurer: true }
        });
        
        if (montageData?.measurer?.installerProfile?.measurementRate) {
            const rate = montageData.measurer.installerProfile.measurementRate;
            
            const existingSettlement = await db.query.settlements.findFirst({
                 where: eq(settlements.montageId, montageId)
            });

            if (existingSettlement) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const calcs = (existingSettlement.calculations as any[]) || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!calcs.find((c: any) => c.type === 'measurement')) {
                    const newCalcs = [...calcs, { type: 'measurement', amount: rate, description: 'Opłata za pomiar' }];
                    const newTotal = existingSettlement.totalAmount + rate;
                    await db.update(settlements).set({ 
                        calculations: newCalcs, 
                        totalAmount: newTotal,
                        updatedAt: new Date()
                    }).where(eq(settlements.id, existingSettlement.id));
                    await logSystemEvent('settlement_update', `Doliczono opłatę za pomiar (${rate} PLN) do rozliczenia`, user.id);
                }
            } else {
                await db.insert(settlements).values({
                    id: crypto.randomUUID(),
                    montageId: montageId,
                    installerId: montageData.measurerId!,
                    status: 'draft',
                    totalAmount: rate,
                    calculations: [{ type: 'measurement', amount: rate, description: 'Opłata za pomiar' }],
                });
                await logSystemEvent('settlement_create', `Utworzono rozliczenie z opłatą za pomiar (${rate} PLN)`, user.id);
            }
        }
    }
    // ------------------------------------------------

	await db
		.update(montages)
		.set({ 
            status: resolved, 
            updatedAt: new Date(),
            completedAt: resolved === 'completed' ? new Date() : null
        })
		.where(eq(montages.id, montageId));

    if (resolved === 'completed') {
        const montageWithRelations = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            with: {
                architect: true,
                partner: true,
                customer: true,
            }
        });

        if (montageWithRelations) {
            // Priority 1: Architect Commission
            if (montageWithRelations.architectId && montageWithRelations.architect && montageWithRelations.architect.architectProfile?.commissionRate) {
                const existingCommission = await db.query.commissions.findFirst({
                    where: eq(commissions.montageId, montageId),
                });

                if (!existingCommission) {
                    const rate = montageWithRelations.architect.architectProfile.commissionRate;
                    const area = montageWithRelations.floorArea || 0;
                    const amount = Math.round(area * rate * 100); // in grosze

                    if (amount > 0) {
                        await db.insert(commissions).values({
                            id: crypto.randomUUID(),
                            architectId: montageWithRelations.architectId,
                            montageId: montageId,
                            amount,
                            rate,
                            area,
                            status: 'pending',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                        
                        await logSystemEvent('create_commission', `Utworzono prowizję dla architekta ${montageWithRelations.architect.name} za montaż ${montageWithRelations.clientName}`, user.id);
                    }
                }
            } 
            
            // Priority 2: Partner Commission
            if (montageWithRelations.partnerId && montageWithRelations.partner && montageWithRelations.partner.partnerProfile?.commissionRate) {
                const existingPartnerCommission = await db.query.partnerCommissions.findFirst({
                    where: eq(partnerCommissions.montageId, montageId),
                });

                if (!existingPartnerCommission) {
                    const rate = montageWithRelations.partner.partnerProfile.commissionRate;
                    const area = montageWithRelations.floorArea || 0;
                    const amount = Math.round(area * rate * 100); // in grosze

                    if (amount > 0) {
                        await db.insert(partnerCommissions).values({
                            id: crypto.randomUUID(),
                            partnerId: montageWithRelations.partnerId,
                            montageId: montageId,
                            amount,
                            rate,
                            area,
                            status: 'pending',
                            createdAt: new Date(),
                            // approvedAt: null
                        });
                        
                        await logSystemEvent('create_commission', `Utworzono prowizję dla partnera ${montageWithRelations.partner.name} za montaż ${montageWithRelations.clientName}`, user.id);
                    }
                }
            }

            /*
            // Priority 3: Referral Commission (only if no architect)
            else if (montageWithRelations.customer?.referredById) {
                const referrerId = montageWithRelations.customer.referredById;
                const existingReferralCommission = await db.query.referralCommissions.findFirst({
                    where: eq(referralCommissions.montageId, montageId)
                });

                if (!existingReferralCommission) {
                    const area = montageWithRelations.floorArea || 0;
                    const rate = 10; // 10 PLN
                    const amount = Math.round(area * rate * 100); // in grosze

                    if (amount > 0) {
                        await db.transaction(async (tx) => {
                            await tx.insert(referralCommissions).values({
                                id: crypto.randomUUID(),
                                montageId: montageId,
                                beneficiaryCustomerId: referrerId,
                                amount,
                                floorArea: area,
                                ratePerSqm: 1000, // 10.00 PLN
                                status: 'approved',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });

                            const referrer = await tx.query.customers.findFirst({
                                where: eq(customers.id, referrerId),
                                columns: { referralBalance: true }
                            });

                            if (referrer) {
                                await tx.update(customers)
                                    .set({ referralBalance: (referrer.referralBalance || 0) + amount })
                                    .where(eq(customers.id, referrerId));
                            }
                        });

                        await logSystemEvent('create_referral_commission', `Utworzono prowizję z polecenia dla klienta ${referrerId} za montaż ${montageWithRelations.clientName}`, user.id);
                    }
                }
            }
            */
        }
    }

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusLabel = statusDefinitions.find(d => d.id === resolved)?.label || resolved;

    const montageLabel = montage.displayId ? `${montage.displayId} (${montage.clientName})` : montage.clientName;
	await logSystemEvent('update_montage_status', `Zmiana statusu montażu ${montageLabel} na ${statusLabel}`, user.id);

	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type UpdateMontageContactDetailsInput = {
	montageId: string;
	clientName: string;
	contactPhone?: string;
	contactEmail?: string;
	scheduledInstallationDate?: string;
	scheduledInstallationEndDate?: string;
    measurementDate?: string;
	billingAddress?: string;
	billingCity?: string;
    billingPostalCode?: string;
	installationAddress?: string;
	installationCity?: string;
    source?: string;
    forecastedInstallationDate?: string;
    sampleStatus?: string;
    estimatedFloorArea?: number;
    isCompany?: boolean;
    companyName?: string;
    nip?: string;
    isHousingVat?: boolean;
};

export async function updateMontageContactDetails({
	montageId,
	clientName,
	contactPhone,
	contactEmail,
	scheduledInstallationDate,
	scheduledInstallationEndDate,
    measurementDate,
	billingAddress,
	billingCity,
    billingPostalCode,
	installationAddress,
	installationCity,
    source,
    forecastedInstallationDate,
    sampleStatus,
    estimatedFloorArea,
    isCompany,
    companyName,
    nip,
    isHousingVat,
}: UpdateMontageContactDetailsInput) {
	await requireUser();

	const trimmedName = clientName.trim();
	if (!trimmedName) {
		throw new Error('Podaj nazwę klienta.');
	}

	const normalize = (value: string | undefined) => {
		const trimmed = value?.trim() ?? '';
		return trimmed ? trimmed : null;
	};

	const normalizedPhone = normalize(contactPhone);
	const normalizedEmail = normalize(contactEmail);
	if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
		throw new Error('Podaj prawidłowy adres e-mail.');
	}

	const normalizedBillingAddress = normalize(billingAddress);
	const normalizedInstallationAddress = normalize(installationAddress);
	const normalizedBillingCity = normalize(billingCity);
	const normalizedInstallationCity = normalize(installationCity);

	let scheduledInstallationAt: Date | null = null;
	if (scheduledInstallationDate && scheduledInstallationDate.trim()) {
		const parsed = new Date(`${scheduledInstallationDate}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			throw new Error('Podaj prawidłową datę montażu.');
		}
		scheduledInstallationAt = parsed;
	}

	let scheduledInstallationEndAt: Date | null = null;
	if (scheduledInstallationEndDate && scheduledInstallationEndDate.trim()) {
		const parsed = new Date(`${scheduledInstallationEndDate}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			throw new Error('Podaj prawidłową datę zakończenia montażu.');
		}
		scheduledInstallationEndAt = parsed;
	}

    let measurementAt: Date | null = null;
    if (measurementDate && measurementDate.trim()) {
        const parsed = new Date(measurementDate);
        if (!Number.isNaN(parsed.getTime())) {
            measurementAt = parsed;
        } else {
            const parsedDateOnly = new Date(`${measurementDate}T00:00:00`);
            if (!Number.isNaN(parsedDateOnly.getTime())) {
                measurementAt = parsedDateOnly;
            } else {
                throw new Error('Podaj prawidłową datę pomiaru.');
            }
        }
    }

    let forecastedInstallationAt: Date | null = null;
    if (forecastedInstallationDate && forecastedInstallationDate.trim()) {
        const parsed = new Date(`${forecastedInstallationDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('Podaj prawidłową szacowaną datę montażu.');
        }
        forecastedInstallationAt = parsed;
    }

	const fallbackAddress = normalizedInstallationAddress ?? normalizedBillingAddress;
	const fallbackCity = normalizedInstallationCity ?? normalizedBillingCity;
	const combinedAddress = [fallbackAddress, fallbackCity].filter(Boolean).join(', ') || null;

    // Update Customer Source if provided
    if (source) {
        const montage = await db.query.montages.findFirst({
            where: (table, { eq }) => eq(table.id, montageId),
            columns: { customerId: true }
        });

        if (montage?.customerId) {
            await db.update(customers)
                .set({ source: source as CustomerSource, updatedAt: new Date() })
                .where(eq(customers.id, montage.customerId));
        }
    }

	await db
		.update(montages)
		.set({
			clientName: trimmedName,
			contactPhone: normalizedPhone,
			contactEmail: normalizedEmail,
            forecastedInstallationDate: forecastedInstallationAt,
			scheduledInstallationAt,
			scheduledInstallationEndAt,
            measurementDate: measurementAt,
			billingAddress: normalizedBillingAddress,
			billingCity: normalizedBillingCity,
            billingPostalCode: billingPostalCode || null,
			installationAddress: normalizedInstallationAddress,
			installationCity: normalizedInstallationCity,
            sampleStatus: sampleStatus ? (sampleStatus as MontageSampleStatus) : undefined,
            estimatedFloorArea: estimatedFloorArea,
            isCompany: isCompany ?? false,
            companyName: companyName || null,
            nip: nip || null,
            isHousingVat: isHousingVat ?? false,
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

    // Log contact details update
    const user = await requireUser();
    const changes = [];
    if (scheduledInstallationAt) changes.push(`Data montażu: ${scheduledInstallationAt.toLocaleDateString()}`);
    if (measurementAt) changes.push(`Data pomiaru: ${measurementAt.toLocaleDateString()}`);
    if (forecastedInstallationAt) changes.push(`Szacowana data: ${forecastedInstallationAt.toLocaleDateString()}`);
    
    await logSystemEvent(
        'update_montage_details', 
        `Zaktualizowano szczegóły montażu. ${changes.length > 0 ? 'Zmiany terminów: ' + changes.join(', ') : 'Zaktualizowano dane kontaktowe/adresowe'}`, 
        user.id
    );

    // Google Calendar Sync
    const montage = await db.query.montages.findFirst({
        where: (table, { eq }) => eq(table.id, montageId),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
    const montageUrl = appUrl ? `${appUrl}/dashboard/crm/montaze/${montageId}` : '';

    const isCalendarUpdateEnabled = await isSystemAutomationEnabled('calendar_update');
    const isCalendarCreateEnabled = await isSystemAutomationEnabled('calendar_create');

    if (montage && montage.googleEventId) {
        if (scheduledInstallationAt) {
            if (isCalendarUpdateEnabled) {
                const endDate = scheduledInstallationEndAt || new Date(scheduledInstallationAt.getTime() + 60 * 60 * 1000);
                await updateGoogleCalendarEvent(montage.googleEventId, {
                    summary: `Montaż: ${trimmedName} (${montage.displayId})`,
                    description: `Montaż dla klienta: ${trimmedName}\nTelefon: ${normalizedPhone || 'Brak'}\nAdres: ${combinedAddress || 'Brak'}${montageUrl ? `\n\nLink do montażu: ${montageUrl}` : ''}`,
                    location: combinedAddress || '',
                    start: { dateTime: scheduledInstallationAt.toISOString() },
                    end: { dateTime: endDate.toISOString() },
                });
            }
        } else {
            // If date is removed, maybe delete event? Or keep it?
            // For now, let's delete it if date is removed
            if (isCalendarUpdateEnabled) {
                await deleteGoogleCalendarEvent(montage.googleEventId);
                await db.update(montages).set({ googleEventId: null }).where(eq(montages.id, montageId));
            }
        }
    } else if (montage && !montage.googleEventId && scheduledInstallationAt) {
        if (isCalendarCreateEnabled) {
            // Create new event if it doesn't exist
            const endDate = scheduledInstallationEndAt || new Date(scheduledInstallationAt.getTime() + 60 * 60 * 1000);
            
            const attendees: { email: string }[] = [];
            if (montage.installerId) {
                const installer = await db.query.users.findFirst({
                    where: eq(users.id, montage.installerId),
                    columns: { email: true }
                });
                if (installer?.email) {
                    attendees.push({ email: installer.email });
                }
            }

            const eventId = await createGoogleCalendarEvent({
                summary: `Montaż: ${trimmedName} (${montage.displayId})`,
                description: `Montaż dla klienta: ${trimmedName}\nTelefon: ${normalizedPhone || 'Brak'}\nAdres: ${combinedAddress || 'Brak'}${montageUrl ? `\n\nLink do montażu: ${montageUrl}` : ''}`,
                location: combinedAddress || '',
                start: { dateTime: scheduledInstallationAt.toISOString() },
                end: { dateTime: endDate.toISOString() },
                attendees,
            });

            if (eventId) {
                await db.update(montages).set({ googleEventId: eventId }).where(eq(montages.id, montageId));
            }
        }
    }

    // 🔔 Notification (MONTAGE_SCHEDULED)
    // Only send if we have a scheduled date and contact info
    if (scheduledInstallationAt && (normalizedEmail || normalizedPhone)) {
        const formattedDate = scheduledInstallationAt.toLocaleDateString('pl-PL');
        const formattedTime = '08:00'; // Default start time for installation, usually full day
        const installerName = montage?.installerId ? 'Zespół Montażowy' : 'Do ustalenia';

        // We check if date changed or just sending confirmation? 
        // For 'TOP UX', maybe we should check if it's a new date.
        // But since this action is 'update details', assume any non-null date means "Confirmed/Re-confirmed".
        // To be safe, we could check against old date in 'montage', but let's just send it.
        // Users can toggle it off in settings if it's spammy.
        
        await sendNotification(
            'MONTAGE_SCHEDULED',
            { email: normalizedEmail, phone: normalizedPhone },
            {
                montage_number: montage?.displayId || '...',
                client_name: trimmedName,
                date: formattedDate,
                time: formattedTime,
                address: combinedAddress || '',
                installer_name: installerName
            },
            { id: montageId, type: 'montage' }
        );
    }

	revalidatePath(MONTAGE_DASHBOARD_PATH);
	revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function addMontageNote(formData: FormData) {
	const user = await requireUser();

const montageIdRaw = formData.get('montageId');
const contentRaw = formData.get('content');
const attachmentTitleRaw = formData.get('attachmentTitle');
const isInternalRaw = formData.get('isInternal');
const fileField = formData.get('attachment');

const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
const content = typeof contentRaw === 'string' ? contentRaw.trim() : '';
const attachmentTitle = typeof attachmentTitleRaw === 'string' ? attachmentTitleRaw.trim() : '';
const isInternal = isInternalRaw === 'true';

if (!montageId) {
	throw new Error('Brakuje identyfikatora montaży.');
}

if (!content) {
	throw new Error('Notatka nie może być pusta.');
}

const montageRecord = await getMontageOrThrow(montageId);

const now = new Date();
const noteId = crypto.randomUUID();

await db.insert(montageNotes).values({
	id: noteId,
	montageId: montageRecord.id,
	content,
    isInternal,
	createdBy: user.id,
	createdAt: now,
});

    await logSystemEvent('add_note', `Dodano notatkę: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`, user.id);

	if (fileField instanceof File && fileField.size > 0) {
		await createMontageAttachment({
		montage: montageRecord,
		file: fileField,
		uploadedBy: user.id,
		title: attachmentTitle ? attachmentTitle : null,
		noteId,
		});
	}

	await touchMontage(montageRecord.id);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type AddMontageTaskInput = {
	montageId: string;
	title: string;
	source?: string;
};

export async function addMontageTask({ montageId, title, source }: AddMontageTaskInput) {
	const user = await requireUser();
	const trimmedTitle = title.trim();

	if (!trimmedTitle) {
		throw new Error('Podaj nazwę zadania.');
	}

	const now = new Date();

	await db.insert(montageTasks).values({
		id: crypto.randomUUID(),
		montageId,
		title: trimmedTitle,
		source: source || 'manual',
		completed: false,
		orderIndex: Number(now.getTime()),
		createdAt: now,
		updatedAt: now,
	});

    await logSystemEvent('add_task', `Dodano zadanie: ${trimmedTitle}`, user.id);

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type ToggleMontageTaskInput = {
	taskId: string;
	montageId: string;
	completed: boolean;
};

export async function toggleMontageTask({ taskId, montageId, completed }: ToggleMontageTaskInput) {
	await requireUser();

	await db
		.update(montageTasks)
		.set({ completed, updatedAt: new Date() })
		.where(and(eq(montageTasks.id, taskId), eq(montageTasks.montageId, montageId)));

    const task = await db.query.montageTasks.findFirst({
        where: eq(montageTasks.id, taskId),
        columns: { title: true }
    });
    
    if (task) {
        await logSystemEvent(
            completed ? 'complete_task' : 'reopen_task', 
            `${completed ? 'Wykonano' : 'Wznowiono'} zadanie: ${task.title}`, 
            await requireUser().then(u => u.id)
        );
    }

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function addMontageAttachment(formData: FormData) {
	const user = await requireUser();

	const montageIdRaw = formData.get('montageId');
	const titleRaw = formData.get('title');
	const noteIdRaw = formData.get('noteId');
	const taskIdRaw = formData.get('taskId');
    const categoryRaw = formData.get('category');
    const typeRaw = formData.get('type');
	const fileField = formData.get('file');

	const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
	const noteId = typeof noteIdRaw === 'string' ? noteIdRaw.trim() : '';
	const taskId = typeof taskIdRaw === 'string' ? taskIdRaw.trim() : '';
    const category = typeof categoryRaw === 'string' ? categoryRaw.trim() : undefined;
    const type = typeof typeRaw === 'string' ? typeRaw.trim() : undefined;

	if (!montageId) {
		throw new Error('Brakuje identyfikatora montaży.');
	}

	if (!(fileField instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	const montageRecord = await getMontageOrThrow(montageId);

	await createMontageAttachment({
		montage: montageRecord,
		file: fileField,
		uploadedBy: user.id,
		title: title ? title : null,
		noteId: noteId || null,
		taskId: taskId || null,
        category,
        type,
	});

    await logSystemEvent('add_attachment', `Dodano załącznik: ${title || fileField.name}`, user.id);

	await touchMontage(montageRecord.id);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type ToggleMontageChecklistInput = {
	itemId: string;
	montageId: string;
	completed: boolean;
};

export async function toggleMontageChecklistItem({ itemId, montageId, completed }: ToggleMontageChecklistInput) {
	await requireUser();

	const [item] = await db
		.select({ 
			id: montageChecklistItems.id,
			templateId: montageChecklistItems.templateId,
            label: montageChecklistItems.label
		})
		.from(montageChecklistItems)
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)))
		.limit(1);

	if (!item) {
		throw new Error('Nie znaleziono elementu listy kontrolnej.');
	}

	await db
		.update(montageChecklistItems)
		.set({ completed, updatedAt: new Date() })
		.where(eq(montageChecklistItems.id, itemId));

    // Log the checklist action
    const user = await requireUser();
    const actionType = completed ? 'checklist_completed' : 'checklist_uncompleted';
    const itemLabel = item.label || 'Element listy';
    await logSystemEvent(actionType, `Zmieniono status elementu "${itemLabel}" na: ${completed ? 'Wykonane' : 'Do zrobienia'}`, user.id);

    // Smart Checklist Logic: Sample Verification
    if (item.templateId === 'sample_verification') {
        if (completed) {
             await db.update(montages)
                .set({ sampleStatus: 'delivered' })
                .where(and(eq(montages.id, montageId), ne(montages.sampleStatus, 'none')));
        } else {
             await db.update(montages)
                .set({ sampleStatus: 'sent' })
                .where(and(eq(montages.id, montageId), ne(montages.sampleStatus, 'none')));
        }
        revalidatePath(MONTAGE_DASHBOARD_PATH);
        revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    }

    // Stage Completion Logic
    if (item.templateId) {
        const templates = await getMontageChecklistTemplates();
        const currentTemplate = templates.find(t => t.id === item.templateId);
        
        if (currentTemplate && currentTemplate.associatedStage) {
            const stage = currentTemplate.associatedStage;
            const statuses = await getMontageStatusDefinitions();
            const stageIndex = statuses.findIndex(s => s.id === stage);

            if (completed) {
                // Forward Logic (existing)
                // Get all items for this montage
                const allItems = await db
                    .select({
                        id: montageChecklistItems.id,
                        templateId: montageChecklistItems.templateId,
                        completed: montageChecklistItems.completed
                    })
                    .from(montageChecklistItems)
                    .where(eq(montageChecklistItems.montageId, montageId));

                // Filter items belonging to the same stage
                const stageItems = allItems.filter(i => {
                    const t = templates.find(temp => temp.id === i.templateId);
                    return t?.associatedStage === stage;
                });

                // Check if all are completed
                const allCompleted = stageItems.every(i => i.completed);

                if (allCompleted) {
                    // Find next stage
                    if (stageIndex !== -1 && stageIndex < statuses.length - 1) {
                        const nextStatus = statuses[stageIndex + 1];
                        
                        // Check if current montage status is the same as the stage
                        const montage = await db.query.montages.findFirst({
                            where: eq(montages.id, montageId),
                            columns: { status: true }
                        });

                        if (montage && montage.status === stage) {
                            // Check automation setting
                            const step = PROCESS_STEPS.find(s => s.relatedStatuses.includes(stage as MontageStatus));
                            const autoAdvanceId = step ? `auto_advance_${step.id}` : null;
                            const shouldAutoAdvance = autoAdvanceId ? await isProcessAutomationEnabled(autoAdvanceId) : true;

                            // Special case: 'new_lead' stage requires manual data entry (ConvertLeadDialog), so we skip auto-advance
                            if (shouldAutoAdvance && stage !== 'new_lead') {
                                await updateMontageStatus({ montageId, status: nextStatus.id });
                            }
                        }
                    }
                }
            } else {
                // Backward Logic (Rollback)
                const montage = await db.query.montages.findFirst({
                    where: eq(montages.id, montageId),
                    columns: { status: true }
                });

                if (montage) {
                    const currentStatusIndex = statuses.findIndex(s => s.id === montage.status);
                    
                    // If current status is "ahead" of the item's stage (meaning we passed this stage),
                    // OR if we are IN the next stage (which implies previous stage is done),
                    // we should revert to the item's stage.
                    
                    // Example: Item is in 'before_measurement' (index 1).
                    // Current status is 'before_first_payment' (index 2).
                    // We unchecked an item from 'before_measurement'.
                    // We should go back to 'before_measurement'.
                    
                    if (currentStatusIndex > stageIndex) {
                         await updateMontageStatus({ montageId, status: stage });
                         await logSystemEvent('update_montage_status', `Cofnięto status do "${statuses[stageIndex]?.label || stage}" z powodu odznaczenia elementu listy.`, user.id);
                    }
                }
            }
        }
    }

	if (completed && item.templateId) {
		const rules = await getMontageAutomationRules();
		const rule = rules.find(r => r.checklistItemId === item.templateId);
		
		if (rule) {
			await updateMontageStatus({ montageId, status: rule.targetStatus });
			// Note: updateMontageStatus already logs the event
		}
	}

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type UpdateMontageMaterialsInput = {
	montageId: string;
	materialDetails: string;
	finalPanelAmount?: number | null;
	panelModel?: string | null;
    panelProductId?: number | string | null;
	floorDetails?: string | null;
	materialsEditHistory?: MaterialsEditHistoryEntry[];
};

export async function updateMontageMaterialDetails({
	montageId,
	materialDetails,
	finalPanelAmount,
	panelModel,
    panelProductId,
	floorDetails,
	materialsEditHistory,
}: UpdateMontageMaterialsInput) {
	await requireUser();

	const sanitized = materialDetails.trim();

	await db
		.update(montages)
		.set({
			materialDetails: sanitized ? sanitized : null,
			measurementDetails: sanitized ? sanitized : null, // Sync with measurementDetails
			finalPanelAmount,
			panelModel,
            panelProductId: panelProductId?.toString(),
			floorDetails,
			materialsEditHistory,
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

    const user = await requireUser();
    await logSystemEvent('update_materials', 'Zaktualizowano specyfikację materiałową', user.id);

	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function updateMontageClientInfo(montageId: string, clientInfo: string) {
    const user = await requireUser();
    await db.update(montages)
        .set({ 
            clientInfo: clientInfo,
            updatedAt: new Date() 
        })
        .where(eq(montages.id, montageId));
    
    await logSystemEvent('update_client_info', 'Zaktualizowano wymagania klienta (Lead)', user.id);

    revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function generateMontageToken(montageId: string) {
    const user = await requireUser();
    
    // Check if token exists
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { accessToken: true }
    });

    if (montage?.accessToken) {
        return montage.accessToken;
    }

    const token = randomUUID();
    
    await db.update(montages)
        .set({ accessToken: token, updatedAt: new Date() })
        .where(eq(montages.id, montageId));

    await logSystemEvent('generate_token', 'Wygenerowano link dostępu dla klienta', user.id);
    
    return token;
}

export async function updateMontageLeadData(montageId: string, data: { 
    clientInfo?: string; 
    estimatedFloorArea?: number;
    forecastedInstallationDate?: Date | null;
    measurementInstallationMethod?: 'click' | 'glue' | null;
    measurementFloorPattern?: 'classic' | 'herringbone' | null;
}) {
    await requireUser();
    await db.update(montages)
        .set({ 
            ...(data.clientInfo !== undefined && { clientInfo: data.clientInfo }),
            ...(data.estimatedFloorArea !== undefined && { estimatedFloorArea: data.estimatedFloorArea }),
            ...(data.forecastedInstallationDate !== undefined && { forecastedInstallationDate: data.forecastedInstallationDate }),
            ...(data.measurementInstallationMethod !== undefined && { measurementInstallationMethod: data.measurementInstallationMethod }),
            ...(data.measurementFloorPattern !== undefined && { measurementFloorPattern: data.measurementFloorPattern }),
            updatedAt: new Date() 
        })
        .where(eq(montages.id, montageId));
    
    revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function updateMontageMeasurementDate(montageId: string, date: Date | null) {
    const user = await requireUser();
    
    await db.update(montages)
        .set({ 
            measurementDate: date,
            updatedAt: new Date() 
        })
        .where(eq(montages.id, montageId));

    if (date) {
        await logSystemEvent('update_measurement_date', `Ustawiono datę pomiaru na: ${date.toLocaleDateString()}`, user.id);
    } else {
        await logSystemEvent('update_measurement_date', `Usunięto datę pomiaru`, user.id);
    }

    // Calendar Sync
    try {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
        });

        if (montage) {
            // Priority: Measurer -> Installer -> Current User
            const targetUserId = montage.measurerId || montage.installerId || user.id;

            if (date) {
                const city = montage.installationCity || 'Brak miasta';
                const event = {
                    summary: `Pomiar: ${montage.clientName} - ${city} - Prime Podłoga`,
                    description: `Adres: ${montage.installationAddress || montage.address || 'Brak adresu'}\nTel: ${montage.contactPhone || 'Brak'}\nLink: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm/montaze/${montage.id}`,
                    location: montage.installationAddress || montage.address || '',
                    start: { dateTime: date.toISOString() },
                    end: { dateTime: new Date(date.getTime() + 60 * 60 * 1000).toISOString() }, // Default 1h
                };

                if (montage.googleEventId) {
                    await updateUserCalendarEvent(targetUserId, montage.googleEventId, event);
                } else {
                    const newEventId = await createUserCalendarEvent(targetUserId, event);
                    if (newEventId) {
                        await db.update(montages)
                            .set({ googleEventId: newEventId })
                            .where(eq(montages.id, montageId));
                    }
                }
            } else if (montage.googleEventId) {
                await deleteUserCalendarEvent(targetUserId, montage.googleEventId);
                await db.update(montages)
                    .set({ googleEventId: null })
                    .where(eq(montages.id, montageId));
            }

            // Notifications (SMS & Email)
            if (date) {
                const formattedDate = date.toLocaleDateString('pl-PL');
                const formattedTime = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
                const address = montage.installationAddress || montage.address || 'Brak adresu';
                
                // 🔔 Notifications (Centralized)
                await sendNotification(
                    'MEASUREMENT_SCHEDULED',
                    { email: montage.contactEmail, phone: montage.contactPhone },
                    {
                        montage_number: montage.displayId,
                        client_name: montage.clientName || 'Klient',
                        date: formattedDate,
                        time: formattedTime,
                        address: address
                    },
                    { id: montage.id, type: 'montage' }
                );
            }
        }
    } catch (e) {
        console.error("Calendar sync failed", e);
    }

    revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function uploadChecklistAttachment(formData: FormData) {
	const user = await requireUser();

	const montageIdRaw = formData.get('montageId');
	const itemIdRaw = formData.get('itemId');
	const titleRaw = formData.get('title');
	const fileField = formData.get('file');

	const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
	const itemId = typeof itemIdRaw === 'string' ? itemIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

	if (!montageId || !itemId) {
		throw new Error('Brakuje danych listy kontrolnej.');
	}

	if (!(fileField instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	const [item] = await db
		.select({
			id: montageChecklistItems.id,
			allowAttachment: montageChecklistItems.allowAttachment,
            label: montageChecklistItems.label,
		})
		.from(montageChecklistItems)
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)))
		.limit(1);

	if (!item) {
		throw new Error('Nie znaleziono elementu listy kontrolnej.');
	}

	if (!item.allowAttachment) {
		throw new Error('Załącznik nie jest dostępny dla tego elementu.');
	}

	const montageRecord = await getMontageOrThrow(montageId);
	const attachmentId = await createMontageAttachment({
		montage: montageRecord,
		file: fileField,
		uploadedBy: user.id,
		title: title ? title : null,
		noteId: null,
	});

	await db
		.update(montageChecklistItems)
		.set({ attachmentId, updatedAt: new Date() })
		.where(eq(montageChecklistItems.id, itemId));

    await logSystemEvent('upload_checklist_attachment', `Dodano załącznik do elementu listy: ${item.label || 'Element listy'}`, user.id);

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function initializeMontageChecklist(montageId: string) {
	await requireUser();

	const montageRecord = await getMontageOrThrow(montageId);
	const templates = await getMontageChecklistTemplates();

	if (templates.length === 0) {
		throw new Error('Brak zdefiniowanych szablonów listy kontrolnej.');
	}

	const now = new Date();

	// Check if items already exist to avoid duplicates
	const existingCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(montageChecklistItems)
		.where(eq(montageChecklistItems.montageId, montageId))
		.then(res => res[0]?.count ?? 0);

	if (existingCount > 0) {
		return; // Already initialized
	}

	await db.insert(montageChecklistItems).values(
		templates.map((template, index) => ({
			id: crypto.randomUUID(),
			montageId: montageRecord.id,
			templateId: template.id,
			label: template.label,
			allowAttachment: template.allowAttachment,
			completed: false,
			orderIndex: index,
			createdAt: now,
			updatedAt: now,
		}))
	);

    const user = await requireUser();
    await logSystemEvent('init_checklist', 'Zainicjalizowano listę kontrolną', user.id);

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function addMontageChecklistItem({ montageId, label, allowAttachment }: { montageId: string; label: string; allowAttachment: boolean }) {
	const user = await requireUser();
	await getMontageOrThrow(montageId);

	// Get max order index
	const maxOrder = await db
		.select({ maxOrder: sql<number>`max(${montageChecklistItems.orderIndex})` })
		.from(montageChecklistItems)
		.where(eq(montageChecklistItems.montageId, montageId))
		.then(res => res[0]?.maxOrder ?? -1);

	await db.insert(montageChecklistItems).values({
		id: crypto.randomUUID(),
		montageId,
		templateId: 'custom',
		label,
		allowAttachment,
		completed: false,
		orderIndex: maxOrder + 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

    await logSystemEvent('add_checklist_item', `Dodano element listy: ${label}`, user.id);

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function deleteMontageChecklistItem({ montageId, itemId }: { montageId: string; itemId: string }) {
	const user = await requireUser();
	await getMontageOrThrow(montageId);

    const item = await db.query.montageChecklistItems.findFirst({
        where: and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)),
    });

	await db.delete(montageChecklistItems)
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)));

    if (item) {
        await logSystemEvent('delete_checklist_item', `Usunięto element listy: ${item.label}`, user.id);
    }

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function updateMontageChecklistItemLabel({ montageId, itemId, label }: { montageId: string; itemId: string; label: string }) {
	const user = await requireUser();
	await getMontageOrThrow(montageId);

    const item = await db.query.montageChecklistItems.findFirst({
        where: and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)),
    });

	await db.update(montageChecklistItems)
		.set({ label, updatedAt: new Date() })
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)));

    if (item && item.label !== label) {
        await logSystemEvent('update_checklist_item', `Zmieniono nazwę elementu listy z "${item.label}" na "${label}"`, user.id);
    }

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

// import { erpProducts, erpCategories } from '@/lib/db/schema';

export async function getMontageProducts(options: { type: 'panel' | 'accessory', category?: string }) {
    await requireUser();
    
    let whereClause: SQL | undefined = eq(erpProducts.status, 'active');

    if (options.category) {
        const category = await db.query.erpCategories.findFirst({
            where: eq(erpCategories.name, options.category)
        });
        if (category) {
            whereClause = and(whereClause, eq(erpProducts.categoryId, category.id));
        }
    } else if (options.type === 'accessory') {
        const accessoryCats = ['Chemia / Kleje', 'Listwy', 'Podkłady'];
        const cats = await db.query.erpCategories.findMany({
            where: inArray(erpCategories.name, accessoryCats)
        });
        if (cats.length > 0) {
             whereClause = and(whereClause, inArray(erpProducts.categoryId, cats.map(c => c.id)));
        }
    } else {
        // Fallback for panels if no category selected - show all panels
        const panelCats = [
            'Panele - Click - Klasyczne',
            'Panele - Click - Jodełka',
            'Panele - Klejone - Klasyczne',
            'Panele - Klejone - Jodełka'
        ];
        const cats = await db.query.erpCategories.findMany({
            where: inArray(erpCategories.name, panelCats)
        });
        if (cats.length > 0) {
             whereClause = and(whereClause, inArray(erpProducts.categoryId, cats.map(c => c.id)));
        }
    }

    const results = await db.select({
        id: erpProducts.id,
        wooId: erpProducts.wooId,
        name: erpProducts.name,
        sku: erpProducts.sku,
        imageUrl: erpProducts.imageUrl,
        stockStatus: sql<string>`'instock'`,
        stockQuantity: erpProducts.stockQuantity,
    })
    .from(erpProducts)
    .where(whereClause);

    // Map to match expected interface (id as number if possible, but erpProducts uses string id)
    // The frontend expects number id? Let's check ProductSelectorModal.
    // ProductSelectorModal expects: id: number;
    // But erpProducts.id is string (uuid).
    // I need to update ProductSelectorModal to accept string id.

    return results.map(p => ({
        ...p,
        id: p.id
    }));
}

export async function updateMontageCostEstimation({
    montageId,
    measurementAdditionalMaterials,
    additionalServices,
    baseServices = [],
    completed = false
}: {
    montageId: string;
    measurementAdditionalMaterials: {
        id: string;
        name: string;
        quantity: string;
        unit?: string;
        supplySide: 'installer' | 'company';
        estimatedCost?: number;
    }[];
    additionalServices: {
        id: string;
        name: string;
        quantity: number;
        unit: string;
        price: number;
    }[];
    baseServices?: {
        serviceId?: string;
        name: string;
        quantity: number;
        unit: string;
        price: number;
        method?: string;
        pattern?: string;
    }[];
    completed?: boolean;
}) {
    const user = await requireUser();

    // 1. Update Materials (with costs)
    await db
        .update(montages)
        .set({
            measurementAdditionalMaterials,
            costEstimationCompletedAt: completed ? new Date() : undefined,
            updatedAt: new Date(),
        })
        .where(eq(montages.id, montageId));

    await logSystemEvent('update_cost_estimation', `Zaktualizowano kosztorys (Status: ${completed ? 'Zakończony' : 'W trakcie'})`, user.id);

    // 2. Update Services (Reset and Add)
    // We clear existing service items for this montage as this action is considered a full reset/update of the cost estimation.
    await db.delete(montageServiceItems).where(eq(montageServiceItems.montageId, montageId));

    const montage = await getMontageOrThrow(montageId);
    const vatRate = montage.isHousingVat ? 0.08 : 0.23;
    const genericService = await db.query.services.findFirst(); // Fallback service

    // A. Add Base Services
    if (baseServices.length > 0) {
        for (const service of baseServices) {
             const targetServiceId = service.serviceId || genericService?.id;
             if (targetServiceId) {
                await db.insert(montageServiceItems).values({
                    id: crypto.randomUUID(),
                    montageId: montageId,
                    serviceId: targetServiceId,
                    snapshotName: service.name,
                    quantity: service.quantity,
                    clientPrice: service.price, // Base price is Net
                    installerRate: service.price, // Assuming cost = price for base services for now
                    vatRate: vatRate,
                });
             }
        }
    }

    // B. Add Additional Services
    if (additionalServices.length > 0) {
        if (genericService) {
            for (const service of additionalServices) {
                await db.insert(montageServiceItems).values({
                    id: crypto.randomUUID(),
                    montageId: montageId,
                    serviceId: genericService.id,
                    snapshotName: service.name,
                    quantity: service.quantity,
                    clientPrice: service.price, 
                    installerRate: service.price, 
                    vatRate: vatRate,
                });
            }
        }
    }

    revalidatePath(MONTAGE_DASHBOARD_PATH);
    revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function updateMontageMeasurement({
	montageId,
	measurementDetails,
	floorArea,
	floorDetails,
	panelModel,
    panelProductId,
	panelWaste,
	modelsApproved,
	additionalInfo,
	sketchUrl,
	scheduledInstallationAt,
	scheduledInstallationEndAt,
    measurementDate,
    measurementInstallationMethod,
    measurementFloorPattern,
    measurementSubfloorCondition,
    measurementAdditionalWorkNeeded,
    measurementAdditionalWorkDescription,
    measurementAdditionalMaterials,
    isHousingVat,
    measurementRooms,
    measurementLayingDirection,
    measurementSketchPhotoUrl,
    floorProducts,
}: {
	montageId: string;
	measurementDetails: string;
	floorArea: number | null;
	floorDetails: string;
	panelModel: string;
    panelProductId?: number | string | null;
	panelWaste: number;
	modelsApproved: boolean;
	additionalInfo: string;
	sketchUrl?: string | null;
	scheduledInstallationAt: number | null;
	scheduledInstallationEndAt: number | null;
    measurementDate?: string | null;
    measurementInstallationMethod?: 'click' | 'glue' | null;
    measurementFloorPattern?: 'classic' | 'herringbone' | null;
    measurementSubfloorCondition?: string | null;
    measurementAdditionalWorkNeeded?: boolean;
    measurementAdditionalWorkDescription?: string | null;
    measurementAdditionalMaterials?: {
        id: string;
        name: string;
        quantity: string;
        unit?: string;
        supplySide: 'installer' | 'company';
        estimatedCost?: number;
    }[] | null;
    isHousingVat?: boolean;
    measurementRooms?: {
        name: string;
        area: number;
    }[] | null;
    measurementLayingDirection?: string | null;
    measurementSketchPhotoUrl?: string | null;
    floorProducts?: {
        id?: string;
        productId?: string | null;
        name: string;
        area: number;
        waste: number;
        installationMethod: 'click' | 'glue' | null;
        pattern?: string | null;
        layingDirection?: string | null;
        rooms?: {
            name: string;
            area: number;
        }[] | null;
    }[] | null;
}) {
    await requireUser();

    let measurementAt: Date | null = null;
    if (measurementDate) {
        // Try parsing as full ISO string first
        const parsed = new Date(measurementDate);
        if (!Number.isNaN(parsed.getTime())) {
            measurementAt = parsed;
        } else {
            // Fallback to date-only parsing if needed
            const parsedDateOnly = new Date(`${measurementDate}T00:00:00`);
            if (!Number.isNaN(parsedDateOnly.getTime())) {
                measurementAt = parsedDateOnly;
            }
        }
    }

	await db
		.update(montages)
		.set({
			measurementDetails,
            measurementDate: measurementAt,
			materialDetails: measurementDetails, // Sync with materialDetails
			floorArea,
			floorDetails,
            isHousingVat,
			panelModel,
            panelProductId: panelProductId?.toString(),
			panelWaste,
			modelsApproved,
			additionalInfo,
			sketchUrl,
			scheduledInstallationAt: scheduledInstallationAt ? new Date(scheduledInstallationAt) : null,
			scheduledInstallationEndAt: scheduledInstallationEndAt ? new Date(scheduledInstallationEndAt) : null,
            installationDateConfirmed: !!scheduledInstallationAt,
            measurementInstallationMethod,
            measurementFloorPattern,
            measurementRooms,
            measurementSubfloorCondition,
            measurementLayingDirection,
            measurementSketchPhotoUrl,
            measurementAdditionalWorkNeeded,
            measurementAdditionalWorkDescription,
            measurementAdditionalMaterials,
			finalPanelAmount: null, // Reset to auto-calculation on measurement update
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

    // Handle Floor Products
    if (floorProducts) {
        // Simple strategy: Delete existing and recreate (safest for full replace updates from UI)
        await db.delete(montageFloorProducts).where(eq(montageFloorProducts.montageId, montageId));
        
        if (floorProducts.length > 0) {
            await db.insert(montageFloorProducts).values(floorProducts.map(fp => ({
                id: randomUUID(),
                montageId,
                productId: fp.productId,
                name: fp.name,
                area: fp.area,
                waste: fp.waste,
                installationMethod: fp.installationMethod,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pattern: fp.pattern as any,
                layingDirection: fp.layingDirection,
                rooms: fp.rooms
            })));
        }
    }

    // --- GOOGLE CALENDAR SYNC (USER) ---
    // If installation date is set, try to sync with installer's private calendar
    if (scheduledInstallationAt) {
        const montage = await getMontageOrThrow(montageId);
        if (montage.installerId) {
            const startDate = new Date(scheduledInstallationAt);
            const endDate = scheduledInstallationEndAt ? new Date(scheduledInstallationEndAt) : new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
            
            const clientName = montage.clientName || 'Klient';
            const city = montage.installationCity || montage.billingCity;
            const street = montage.installationAddress || montage.billingAddress;
            const address = [city, street].filter(Boolean).join(', ');

            await createUserCalendarEvent(montage.installerId, {
                summary: `Montaż: ${clientName}`,
                description: `Adres: ${address}\nTelefon: ${montage.contactPhone || ''}\nLink: https://b2b.primepodloga.pl/dashboard/crm/montaze/${montageId}`,
                location: address,
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() },
            });
        }
    }
    // -----------------------------------

    const user = await requireUser();
    await logSystemEvent('update_measurement', `Zaktualizowano protokół pomiaru (Powierzchnia: ${floorArea}m2)`, user.id);

	revalidatePath(MONTAGE_DASHBOARD_PATH);
	revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function updateMontageRealizationStatus({
    montageId,
    materialStatus,
    materialClaimType,
    installerStatus,
    sampleStatus,
    installerId,
    measurerId,
    architectId
}: {
    montageId: string;
    materialStatus?: MontageMaterialStatus;
    materialClaimType?: MontageMaterialClaimType | null;
    installerStatus?: MontageInstallerStatus;
    sampleStatus?: MontageSampleStatus;
    installerId?: string | null;
    measurerId?: string | null;
    architectId?: string | null;
}) {
    const user = await requireUser();

    const updateData: { 
        materialStatus?: MontageMaterialStatus; 
        materialClaimType?: MontageMaterialClaimType | null;
        installerStatus?: MontageInstallerStatus;
        sampleStatus?: MontageSampleStatus;
        installerId?: string | null;
        measurerId?: string | null;
        architectId?: string | null;
        updatedAt: Date;
    } = {
        updatedAt: new Date()
    };
    
    if (materialStatus !== undefined) updateData.materialStatus = materialStatus;
    if (materialClaimType !== undefined) updateData.materialClaimType = materialClaimType;
    if (installerStatus !== undefined) updateData.installerStatus = installerStatus;
    if (sampleStatus !== undefined) updateData.sampleStatus = sampleStatus;
    if (installerId !== undefined) updateData.installerId = installerId;
    if (measurerId !== undefined) updateData.measurerId = measurerId;
    if (architectId !== undefined) updateData.architectId = architectId;

    // If nothing to update (except updatedAt), return
    if (Object.keys(updateData).length <= 1) return;

    await db.update(montages)
        .set(updateData)
        .where(eq(montages.id, montageId));

    const changes: string[] = [];
    if (materialStatus) {
        const labels: Record<string, string> = {
            'none': 'Niezamówiono',
            'ordered': 'Zamówiono',
            'in_stock': 'Na magazynie',
            'delivered': 'Dostarczono'
        };
        changes.push(`Status materiału: ${labels[materialStatus] || materialStatus}`);
    }
    if (installerStatus) {
        const labels: Record<string, string> = {
            'none': 'Brak',
            'informed': 'Poinformowany',
            'confirmed': 'Potwierdzony'
        };
        changes.push(`Status montażysty: ${labels[installerStatus] || installerStatus}`);
    }

    if (sampleStatus) {
        const labels: Record<string, string> = {
            'none': 'Brak',
            'to_send': 'Do wysłania',
            'sent': 'Wysłane',
            'delivered': 'Dostarczone',
            'returned': 'Zwrócone'
        };
        changes.push(`Status próbek: ${labels[sampleStatus] || sampleStatus}`);
    }
    
    if (installerId !== undefined) {
        if (installerId) {
            const installer = await db.query.users.findFirst({
                where: eq(users.id, installerId),
                columns: { name: true, email: true }
            });
            changes.push(`Zmieniono montażystę na: ${installer?.name || installer?.email || 'Nieznany'}`);
        } else {
            changes.push(`Usunięto montażystę`);
        }
    }

    if (measurerId !== undefined) {
        if (measurerId) {
            const measurer = await db.query.users.findFirst({
                where: eq(users.id, measurerId),
                columns: { name: true, email: true }
            });
            changes.push(`Zmieniono pomiarowca na: ${measurer?.name || measurer?.email || 'Nieznany'}`);
        } else {
            changes.push(`Usunięto pomiarowca`);
        }
    }

    if (architectId !== undefined) {
        if (architectId) {
            const architect = await db.query.users.findFirst({
                where: eq(users.id, architectId),
                columns: { name: true, email: true }
            });
            changes.push(`Zmieniono architekta na: ${architect?.name || architect?.email || 'Nieznany'}`);
        } else {
            changes.push(`Usunięto architekta`);
        }
    }

    // Sync Google Calendar if installer changed
    if (installerId !== undefined) {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            columns: { googleEventId: true }
        });

        if (montage?.googleEventId) {
            const attendees: { email: string }[] = [];
            if (installerId) {
                const installer = await db.query.users.findFirst({
                    where: eq(users.id, installerId),
                    columns: { email: true }
                });
                if (installer?.email) {
                    attendees.push({ email: installer.email });
                }
            }
            await updateGoogleCalendarEvent(montage.googleEventId, { attendees });
        }
    }

    await logSystemEvent(
        'montage.update_realization_status',
        `${changes.join(', ')} [${montageId}]`,
        user.id
    );

    revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function createLead(data: {
    clientName: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    description?: string;
    forecastedInstallationDate?: string;
    sampleStatus?: MontageSampleStatus;
    existingCustomerId?: string;
    source?: CustomerSource;
    architectId?: string;
    partnerId?: string;
}) {
    try {
        const user = await requireUser();
        
        // Determine architect/partner logic
        let finalArchitectId = data.architectId || undefined;
        let finalPartnerId = data.partnerId || undefined;
        let finalSource = data.source;

        if (user.roles.includes('architect') && !user.roles.includes('admin')) {
             finalArchitectId = user.id;
             finalSource = 'architect';
        }
        if (user.roles.includes('partner') && !user.roles.includes('admin')) {
             finalPartnerId = user.id;
             finalSource = 'recommendation'; 
        }
        
        if (data.source === 'architect' && data.architectId) {
            finalArchitectId = data.architectId;
            finalSource = 'architect';
        }

        const result = await createLeadCore({
            ...data,
            source: finalSource,
            architectId: finalArchitectId,
            partnerId: finalPartnerId,
        });

        if (result.success) {
            if (result.montageId && result.status !== 'duplicate_found') {
                 // Log event if new lead (optional, keeping it simple as ID is inside result)
                 // We don't have displayId here unless we return it from createLeadCore. 
                 // It's not critical for logging.
                 await logSystemEvent('create_lead', `Utworzono lead dla ${data.clientName}`, user.id);
            }
            revalidatePath(MONTAGE_DASHBOARD_PATH);
        }

        return result;
    } catch (error) {
        console.error('Error creating lead:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd podczas tworzenia leada.' 
        };
    }
}

async function addAttachment(montageId: string, file: File, title: string, category?: string) {
    const user = await requireUser();
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
    });
    
    if (!montage) throw new Error('Montage not found');

    await createMontageAttachment({
        montage,
        file,
        uploadedBy: user.id,
        title,
        category,
    });
}

export async function createExtendedLead(formData: FormData) {
    const user = await requireUser();
    const now = new Date();
    
    // Auto-assign architect if the creator has the architect role
    const architectId = user.roles.includes('architect') ? user.id : null;

    const displayId = await generateNextMontageId();
    const montageId = crypto.randomUUID();

    const clientName = formData.get('clientName') as string;
    const isCompany = formData.get('isCompany') === 'true';
    const companyName = formData.get('companyName') as string;
    const nip = formData.get('nip') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    
    const billingStreet = formData.get('billingStreet') as string;
    const billingPostalCode = formData.get('billingPostalCode') as string;
    const billingCity = formData.get('billingCity') as string;
    
    const shippingStreet = formData.get('shippingStreet') as string;
    const shippingPostalCode = formData.get('shippingPostalCode') as string;
    const shippingCity = formData.get('shippingCity') as string;
    
    const productId = formData.get('productId') as string;
    const sampleStatus = formData.get('sampleStatus') as string;
    const floorArea = formData.get('floorArea') as string;
    const estimatedDate = formData.get('estimatedDate') as string;
    const notes = formData.get('notes') as string;
    const source = formData.get('source') as string;
    const file = formData.get('file') as File;

    if (!clientName?.trim()) {
        throw new Error('Podaj nazwę klienta.');
    }

    // Create or update customer logic
    const normalizedEmail = email?.trim()?.toLowerCase() || null;
    const normalizedPhone = phone ? normalizePhone(phone) : null;
    const normalizedNip = nip?.trim() || null;
    
    let finalCustomerId: string;
    let existingCustomer = null;

    // 1. Try by email
    if (normalizedEmail) {
        existingCustomer = await db.query.customers.findFirst({
            where: (table, { eq }) => eq(table.email, normalizedEmail),
        });
    }

    // 2. Try by phone if not found
    if (!existingCustomer && normalizedPhone) {
        existingCustomer = await db.query.customers.findFirst({
            where: (table, { eq }) => eq(table.phone, normalizedPhone),
        });
    }

    // 3. Try by NIP if provided
    if (normalizedNip) {
        const customerWithNip = await db.query.customers.findFirst({
            where: (table, { eq }) => eq(table.taxId, normalizedNip),
        });

        if (customerWithNip) {
            if (existingCustomer && existingCustomer.id !== customerWithNip.id) {
                throw new Error('Podany NIP jest już przypisany do innego klienta.');
            }
            if (!existingCustomer) {
                existingCustomer = customerWithNip;
            }
        }
    }

    if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
        // Update existing customer with new data if needed (optional, here we just link)
        // For leads, we might want to update contact info if it's newer
        await db.update(customers)
            .set({
                phone: normalizedPhone || existingCustomer.phone,
                taxId: normalizedNip || existingCustomer.taxId,
                updatedAt: now,
            })
            .where(eq(customers.id, existingCustomer.id));
    } else {
        finalCustomerId = crypto.randomUUID();
        await db.insert(customers).values({
            id: finalCustomerId,
            name: clientName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            taxId: normalizedNip,
            billingStreet: billingStreet?.trim() || null,
            billingCity: billingCity?.trim() || null,
            billingPostalCode: billingPostalCode?.trim() || null,
            shippingStreet: shippingStreet?.trim() || null,
            shippingCity: shippingCity?.trim() || null,
            shippingPostalCode: shippingPostalCode?.trim() || null,
            source: (source as CustomerSource) || (architectId ? 'architect' : 'other'),
            architectId: architectId,
            createdAt: now,
            updatedAt: now,
            referralToken: generatePortalToken(),
        });
    }

    // Format addresses
    const billingAddress = [billingStreet, billingPostalCode, billingCity].filter(Boolean).join(', ');
    const installationAddress = [shippingStreet, shippingPostalCode, shippingCity].filter(Boolean).join(', ');

    // Format notes
    let additionalInfo = notes?.trim() || null;
    if (additionalInfo && architectId) {
        additionalInfo = `**Notatka od Architekta:**\n${additionalInfo}`;
    }

    await db.insert(montages).values({
        id: montageId,
        displayId,
        customerId: finalCustomerId, // Link to the found or new customer
        clientName: clientName.trim(),
        isCompany,
        companyName: companyName?.trim() || null,
        nip: normalizedNip,
        contactPhone: normalizedPhone,
        contactEmail: normalizedEmail,
        
        billingAddress: billingAddress || null,
        billingCity: billingCity?.trim() || null,
        billingPostalCode: billingPostalCode?.trim() || null,
        
        installationAddress: installationAddress || null,
        installationCity: shippingCity?.trim() || null,
        installationPostalCode: shippingPostalCode?.trim() || null,
        
        panelProductId: productId && productId !== 'none' ? productId : null,
        floorArea: floorArea ? parseFloat(floorArea) : null,
        forecastedInstallationDate: estimatedDate ? new Date(estimatedDate) : null,
        
        additionalInfo,
        
        status: 'new_lead',
        sampleStatus: (sampleStatus as MontageSampleStatus) || 'none',
        architectId,
        createdAt: now,
        updatedAt: now,
    });

    // Initialize checklist items
    const checklistItems = DEFAULT_MONTAGE_CHECKLIST.map((template, index) => ({
        id: crypto.randomUUID(),
        montageId: montageId,
        templateId: template.id,
        label: template.label,
        allowAttachment: template.allowAttachment,
        orderIndex: index,
        completed: false,
        createdAt: now,
        updatedAt: now,
    }));

    if (checklistItems.length > 0) {
        await db.insert(montageChecklistItems).values(checklistItems);
    }

    // Handle file upload
    if (file && file.size > 0) {
        try {
            await addAttachment(montageId, file, 'Rzut / Projekt (od Architekta)', MontageSubCategories.MEASUREMENT_BEFORE);
        } catch (e) {
            console.error('Failed to upload attachment for lead', e);
            // Don't fail the whole request if attachment fails, but maybe log it
        }
    }

    await logSystemEvent('create_lead', `Utworzono rozszerzony lead ${displayId} dla ${clientName}`, user.id);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
    return { status: 'success', montageId };
}

export async function deleteMontage(id: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    await db.update(montages)
        .set({ deletedAt: new Date() })
        .where(eq(montages.id, id));
    
    await logSystemEvent('delete_montage', `Usunięto montaż ${id}`, user.id);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
    revalidatePath('/dashboard/calendar');
}

export async function convertLeadToMontage(data: {
    montageId: string;
    clientName: string;
    isCompany: boolean;
    companyName?: string;
    nip?: string;
    contactPhone: string;
    contactEmail: string;
    billingAddress: string;
    billingCity: string;
    billingPostalCode: string;
    installationAddress: string;
    installationCity: string;
    installationPostalCode: string;
    forecastedInstallationDate?: string;
    floorArea?: string;
    productId?: string;
}) {
    const user = await requireUser();
    const montage = await getMontageOrThrow(data.montageId);

    if (montage.status !== 'new_lead') {
        throw new Error('Tylko leady mogą być konwertowane.');
    }

    const normalizedPhone = normalizePhone(data.contactPhone);
    const normalizedNip = data.nip ? data.nip.replace(/\D/g, '') : null;

    // Update Customer
    if (montage.customerId) {
        await db.update(customers)
            .set({
                name: data.clientName,
                email: data.contactEmail,
                phone: normalizedPhone,
                taxId: normalizedNip,
                billingStreet: data.billingAddress,
                billingCity: data.billingCity,
                billingPostalCode: data.billingPostalCode,
                shippingStreet: data.installationAddress,
                shippingCity: data.installationCity,
                shippingPostalCode: data.installationPostalCode,
                updatedAt: new Date(),
            })
            .where(eq(customers.id, montage.customerId));
    }

    // Update Montage
    await db.update(montages)
        .set({
            clientName: data.clientName,
            isCompany: data.isCompany,
            companyName: data.companyName || null,
            nip: normalizedNip,
            contactPhone: normalizedPhone,
            contactEmail: data.contactEmail,
            billingAddress: data.billingAddress,
            billingCity: data.billingCity,
            billingPostalCode: data.billingPostalCode,
            installationAddress: data.installationAddress,
            installationCity: data.installationCity,
            installationPostalCode: data.installationPostalCode,
            forecastedInstallationDate: data.forecastedInstallationDate ? new Date(data.forecastedInstallationDate) : null,
            estimatedFloorArea: data.floorArea ? parseFloat(data.floorArea) : null,
            floorArea: null,
            ...(data.productId !== undefined ? {
                panelProductId: data.productId && data.productId !== 'none' ? data.productId : null,
            } : {}),
            status: 'new_lead',
            updatedAt: new Date(),
        })
        .where(eq(montages.id, data.montageId));

    // Add default checklist
    const templates = await getMontageChecklistTemplates();
    if (templates.length > 0) {
        const now = new Date();
        await db.insert(montageChecklistItems).values(
            templates.map((template, index) => ({
                id: crypto.randomUUID(),
                montageId: data.montageId,
                templateId: template.id,
                label: template.label,
                allowAttachment: template.allowAttachment,
                completed: false,
                orderIndex: index,
                createdAt: now,
                updatedAt: now,
            }))
        );
    }

    await logSystemEvent('convert_lead', `Przekonwertowano lead ${montage.displayId} na montaż`, user.id);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
    return { success: true };
}

export async function sendMeasurementRequestSms(montageId: string) {
    const user = await requireUser();
    
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
    });

    if (!montage) {
        return { error: 'Nie znaleziono montażu.' };
    }

    if (!montage.contactPhone) {
        return { error: 'Brak numeru telefonu klienta.' };
    }

    const message = `Dzień dobry, prosimy o kontakt w celu umówienia pomiaru dla zlecenia ${montage.displayId}. Pozdrawiamy, Zespół`;
    
    const result = await sendSms(montage.contactPhone, message);

    if (result.success) {
        await logSystemEvent('sms_sent', `Wysłano SMS z prośbą o pomiar do klienta ${montage.clientName} (Montage ID: ${montageId})`, user.id);
        return { success: true };
    } else {
        return { error: result.error || 'Błąd wysyłania SMS' };
    }
}



export async function sendDataRequest(montageId: string) {
    const user = await requireUser();
    
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
    let referralToken = montage.customer?.referralToken;

    // Self-healing: Create customer if missing
    if (!customerId) {
        customerId = crypto.randomUUID();
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

    // Generate token if missing
    if (!referralToken) {
        referralToken = generatePortalToken();
        await db.update(customers)
            .set({ referralToken })
            .where(eq(customers.id, customerId!));
    }

    const portalLink = `https://b2b.primepodloga.pl/montaz/${referralToken}`;
    const message = `Dzień dobry! Rozpoczynamy współpracę. Utworzyliśmy dla Ciebie Panel Klienta, gdzie będziesz widzieć postępy prac: ${portalLink}. Prosimy o uzupełnienie adresu, abyśmy mogli zlecić pomiar.`;

    const sentChannels: string[] = [];

    // Send SMS if phone exists
    if (montage.contactPhone) {
        const smsEnabled = await isSystemAutomationEnabled('data_request_sms');
        if (smsEnabled) {
            try {
                await sendSms(montage.contactPhone, message);
                sentChannels.push('SMS');
            } catch (error) {
                console.error('Failed to send SMS:', error);
                // Don't throw, just log
            }
        }
    }

    // 🔔 Notifications (Centralized)
    // We send notification regardless of old 'data_request_email' check because the new system has its own 'isActive' check in DB.
    if (montage.contactEmail || montage.contactPhone) {
        await sendNotification(
            'CLIENT_DATA_REQUEST',
            { email: montage.contactEmail, phone: montage.contactPhone },
            {
                client_name: montage.clientName || 'Klient',
                portal_link: portalLink
            },
            { id: montage.id, type: 'montage' }
        );
        sentChannels.push('Notification');
    }

    const channelsText = sentChannels.length > 0 ? sentChannels.join(', ') : 'brak wysyłki';
    const actionText = sentChannels.length > 0 ? 'Wysłano prośbę o uzupełnienie danych' : 'Wygenerowano link do uzupełnienia danych';

    // Log event
    await logSystemEvent(
        'montage.data_request_sent',
        `${actionText} do klienta (${channelsText})`,
        user.id
    );
    
    // Add note
    await db.insert(montageNotes).values({
        id: crypto.randomUUID(),
        montageId: montageId,
        content: `[System]: ${actionText} (${channelsText}).`,
        isInternal: false,
        createdBy: user.id,
        createdAt: new Date(),
    });

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    
    return {
        success: true,
        link: portalLink,
        message: message,
        sentChannels,
        montagePhone: montage.contactPhone
    };
}

export async function finishMontage(montageId: string) {
    const user = await requireUser();
    
    // Reuse existing logic which handles commissions etc.
    await updateMontageStatus({ montageId, status: 'completed' });

    await logSystemEvent(
        'montage_finished_by_installer', 
        `Montażysta ${user.name} zakończył wizytę/montaż. (ID: ${montageId})`, 
        user.id
    );

    revalidatePath(MONTAGE_DASHBOARD_PATH);
    revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
    return { success: true };
}

export async function assignMeasurerAndAdvance(montageId: string, measurerId: string, requirePayment: boolean = false) {
    const user = await requireUser();
    const montage = await getMontageOrThrow(montageId);

    // Allow conversion from any Lead Phase status
    const LEAD_PHASE_STATUSES = ['new_lead', 'lead_contact', 'lead_payment_pending', 'lead_samples_pending', 'lead_samples_sent', 'lead_pre_estimate'];
    if (!LEAD_PHASE_STATUSES.includes(montage.status)) {
        throw new Error('Tylko leady mogą być przekazywane do pomiaru.');
    }

    if (requirePayment) {
        // 1. Get Shop Config for Measurement Product
        const shopConfig = await db.query.globalSettings.findFirst({
            where: eq(globalSettings.key, 'shop_config'),
        });
        const configValue = shopConfig?.value as ShopConfig | undefined;

        if (!configValue?.measurementProductId) {
            throw new Error('Brak skonfigurowanego produktu "Usługa Pomiaru" w ustawieniach sklepu.');
        }

        // 2. Get Product Details
        const measureProduct = await db.query.erpProducts.findFirst({
            where: eq(erpProducts.id, configValue.measurementProductId),
        });

        if (!measureProduct) {
            throw new Error('Skonfigurowany produkt pomiarowy nie istnieje w bazie.');
        }

        // 3. Create Technical Order
        const orderId = crypto.randomUUID();
        
        // Ensure customer exists (montage should have one, but if not, logic might break)
        if (!montage.customerId) {
            throw new Error('Montaż musi mieć przypisanego klienta, aby wystawić płatność.');
        }

        await db.transaction(async (tx) => {
            // Create Order
            await tx.insert(orders).values({
                id: orderId,
                source: 'shop',
                status: 'order.awaiting_payment',
                customerId: montage.customerId!,
                totalNet: Math.round((parseFloat(measureProduct.price || '0') * 100) / 1.23), 
                totalGross: Math.round(parseFloat(measureProduct.price || '0') * 100),
                currency: 'PLN',
            });

            // Create Order Item
            await tx.insert(orderItems).values({
                id: crypto.randomUUID(),
                orderId: orderId,
                name: measureProduct.name,
                sku: measureProduct.sku,
                quantity: 1,
                unitPrice: Math.round(parseFloat(measureProduct.price || '0') * 100), // Store gross as unit price for simplicity in this context or net? Schema says unit_price. Usually Net or Gross depending on system. Assuming Gross based on totalGross usage.
                taxRate: 23,
            });
            
             // 4. Update Montage
            await tx.update(montages)
            .set({
                measurerId: measurerId, // Assign measurer but...
                status: 'lead_payment_pending', // ...hide under this status
                updatedAt: new Date(),
                // Link order? We might need a field or just rely on customer/time. 
                // For now, we don't have a direct 'orderId' on montage, but we have montagePayments or we can rely on the fact that the client will pay this order.
                // Ideally we should link it. The user mentioned "Tworzymy rekord w tabeli orders... jako zamówienie techniczne, powiązane z montażem".
                // I don't see a `montageId` in `orders` table in the schema I read. 
                // I'll add a note for now. The Payment flow usually matches via `sourceOrderId` or similar.
                // Let's set `sourceOrderId` to montageId for tracking.
            })
            .where(eq(montages.id, montageId));
            
             // Update order with source link
             await tx.update(orders).set({ sourceOrderId: montageId }).where(eq(orders.id, orderId));
        });

        // Ensure token exists for Magic Link
        let token = montage.accessToken;
        if (!token) {
            token = generatePortalToken();
            await db.update(montages).set({ accessToken: token }).where(eq(montages.id, montageId));
        }

        await logSystemEvent(
            'montage.payment_requested',
            `Wymuszono płatność za pomiar. Zlecenie wstrzymane do czasu wpłaty.`,
            user.id
        );

        return { success: true, paymentRequired: true, message: 'Utworzono zamówienie. Oczekiwanie na płatność.', paymentLink: `/montaz/${token}` };
    }

    // Standard Flow (No Payment)
    await db.update(montages)
        .set({
            measurerId: measurerId,
            status: 'measurement_to_schedule', // INBOX MONTAŻYSTY
            updatedAt: new Date(),
        })
        .where(eq(montages.id, montageId));

    // Log event
    const measurer = await db.query.users.findFirst({
        where: (table, { eq }) => eq(table.id, measurerId),
    });

    await logSystemEvent(
        'montage.measurer_assigned',
        `Zlecono pomiar do: ${measurer?.name || measurerId}`,
        user.id
    );

    // Add note
    await db.insert(montageNotes).values({
        id: crypto.randomUUID(),
        montageId: montageId,
        content: `[System]: Zlecono pomiar do: ${measurer?.name || measurerId}. Oczekuje na kontakt z klientem.`,
        isInternal: false,
        createdBy: user.id,
        createdAt: new Date(),
    });

    // TODO: Send notification to measurer (if implemented)

    revalidatePath(MONTAGE_DASHBOARD_PATH);
    revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
    return { success: true };
}

export async function deleteMontageAttachment(attachmentId: string) {
    const user = await requireUser();
    
    const attachment = await db.query.montageAttachments.findFirst({
        where: eq(montageAttachments.id, attachmentId),
    });

    if (attachment) {
        await db.delete(montageAttachments).where(eq(montageAttachments.id, attachmentId));
        await logSystemEvent('delete_attachment', `Usunięto załącznik: ${attachment.title || 'Bez tytułu'}`, user.id);
    }

    revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function getReferrers() {
    await requireUser();
    
    // Get all users who have this role in their roles array
    const allUsers = await db.query.users.findMany({
        where: (table, { eq }) => eq(table.isActive, true),
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
        },
        orderBy: (table, { asc }) => [asc(table.name)],
    });

    return {
        architects: allUsers.filter(u => u.roles.includes('architect')),
        partners: allUsers.filter(u => u.roles.includes('partner')),
    };
}

export async function updateMontageSampleDelivery({
    montageId,
    delivery
}: {
    montageId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delivery: any;
}) {
    await requireUser();
    
    await db.update(montages)
        .set({ sampleDelivery: delivery })
        .where(eq(montages.id, montageId));
        
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

export async function clientUpdateMontageStatus(montageId: string, status: MontageStatus) {
    const user = await requireUser();
    
    await db.update(montages)
        .set({ 
            status, 
            updatedAt: new Date() 
        })
        .where(eq(montages.id, montageId));

    await logSystemEvent('update_status', `Zmieniono status na "${status}"`, user.id);
    
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    revalidatePath('/dashboard/crm/montaze');
}

