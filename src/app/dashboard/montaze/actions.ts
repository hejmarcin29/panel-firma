'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, sql } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
	type MontageStatus,
	montageStatuses,
	customers,
	users,
    commissions,
} from '@/lib/db/schema';
import { uploadMontageObject } from '@/lib/r2/storage';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';
import { getMontageAutomationRules } from '@/lib/montaze/automation';
import { logSystemEvent } from '@/lib/logging';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import type { MaterialsEditHistoryEntry } from './types';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/google/calendar';

const MONTAGE_DASHBOARD_PATH = '/dashboard/montaze';
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function normalizePhone(phone: string): string {
	return phone.replace(/\D/g, '');
}

async function generateNextMontageId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `M/${year}/`;

    const lastMontage = await db.query.montages.findFirst({
        where: (table, { like }) => like(table.displayId, `${prefix}%`),
        orderBy: (table, { desc }) => [desc(table.displayId)],
    });

    let nextNumber = 1;
    if (lastMontage && lastMontage.displayId) {
        const parts = lastMontage.displayId.split('/');
        if (parts.length === 3) {
            const lastNumber = parseInt(parts[2], 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
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
}: {
	montage: typeof montages.$inferSelect;
	file: File;
	uploadedBy: string;
	title: string | null;
	noteId?: string | null;
	taskId?: string | null;
}): Promise<string> {
	ensureValidAttachmentFile(file);

	const uploaded = await uploadMontageObject({
		clientName: montage.clientName,
		file,
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
	if (normalizedEmail || normalizedPhone) {
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
			await db.insert(customers).values({
				id: crypto.randomUUID(),
				...customerData,
				createdAt: now,
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
            status: 'before_measurement',
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
                    status: 'before_measurement',
                    createdAt: now,
                    updatedAt: now,
                });
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
        const montageUrl = appUrl ? `${appUrl}/dashboard/montaze/${finalMontageId}` : '';

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

	await db
		.update(montages)
		.set({ status: resolved, updatedAt: new Date() })
		.where(eq(montages.id, montageId));

    if (resolved === 'completed') {
        const montageWithArchitect = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            with: {
                architect: true,
            }
        });

        if (montageWithArchitect && montageWithArchitect.architectId && montageWithArchitect.architect && montageWithArchitect.architect.architectProfile?.commissionRate) {
            const existingCommission = await db.query.commissions.findFirst({
                where: eq(commissions.montageId, montageId),
            });

            if (!existingCommission) {
                const rate = montageWithArchitect.architect.architectProfile.commissionRate;
                const area = montageWithArchitect.floorArea || 0;
                const amount = Math.round(area * rate * 100); // in grosze

                if (amount > 0) {
                    await db.insert(commissions).values({
                        id: crypto.randomUUID(),
                        architectId: montageWithArchitect.architectId,
                        montageId: montageId,
                        amount,
                        rate,
                        area,
                        status: 'pending',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    
                    await logSystemEvent('create_commission', `Utworzono prowizję dla architekta ${montageWithArchitect.architect.name} za montaż ${montageWithArchitect.clientName}`, user.id);
                }
            }
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
    scheduledSkirtingInstallationDate?: string;
    scheduledSkirtingInstallationEndDate?: string;
	billingAddress?: string;
	billingCity?: string;
	installationAddress?: string;
	installationCity?: string;
};

export async function updateMontageContactDetails({
	montageId,
	clientName,
	contactPhone,
	contactEmail,
	scheduledInstallationDate,
	scheduledInstallationEndDate,
    scheduledSkirtingInstallationDate,
    scheduledSkirtingInstallationEndDate,
	billingAddress,
	billingCity,
	installationAddress,
	installationCity,
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

    let scheduledSkirtingInstallationAt: Date | null = null;
    if (scheduledSkirtingInstallationDate && scheduledSkirtingInstallationDate.trim()) {
        const parsed = new Date(`${scheduledSkirtingInstallationDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('Podaj prawidłową datę montażu listew.');
        }
        scheduledSkirtingInstallationAt = parsed;
    }

    let scheduledSkirtingInstallationEndAt: Date | null = null;
    if (scheduledSkirtingInstallationEndDate && scheduledSkirtingInstallationEndDate.trim()) {
        const parsed = new Date(`${scheduledSkirtingInstallationEndDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('Podaj prawidłową datę zakończenia montażu listew.');
        }
        scheduledSkirtingInstallationEndAt = parsed;
    }

	const fallbackAddress = normalizedInstallationAddress ?? normalizedBillingAddress;
	const fallbackCity = normalizedInstallationCity ?? normalizedBillingCity;
	const combinedAddress = [fallbackAddress, fallbackCity].filter(Boolean).join(', ') || null;

	await db
		.update(montages)
		.set({
			clientName: trimmedName,
			contactPhone: normalizedPhone,
			contactEmail: normalizedEmail,
			billingAddress: normalizedBillingAddress,
			installationAddress: normalizedInstallationAddress,
			billingCity: normalizedBillingCity,
			installationCity: normalizedInstallationCity,
			address: combinedAddress,
			scheduledInstallationAt,
			scheduledInstallationEndAt,
            scheduledSkirtingInstallationAt,
            scheduledSkirtingInstallationEndAt,
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

    // Google Calendar Sync
    const montage = await db.query.montages.findFirst({
        where: (table, { eq }) => eq(table.id, montageId),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
    const montageUrl = appUrl ? `${appUrl}/dashboard/montaze/${montageId}` : '';

    if (montage && montage.googleEventId) {
        if (scheduledInstallationAt) {
            const endDate = scheduledInstallationEndAt || new Date(scheduledInstallationAt.getTime() + 60 * 60 * 1000);
            await updateGoogleCalendarEvent(montage.googleEventId, {
                summary: `Montaż: ${trimmedName} (${montage.displayId})`,
                description: `Montaż dla klienta: ${trimmedName}\nTelefon: ${normalizedPhone || 'Brak'}\nAdres: ${combinedAddress || 'Brak'}${montageUrl ? `\n\nLink do montażu: ${montageUrl}` : ''}`,
                location: combinedAddress || '',
                start: { dateTime: scheduledInstallationAt.toISOString() },
                end: { dateTime: endDate.toISOString() },
            });
        } else {
            // If date is removed, maybe delete event? Or keep it?
            // For now, let's delete it if date is removed
            await deleteGoogleCalendarEvent(montage.googleEventId);
            await db.update(montages).set({ googleEventId: null }).where(eq(montages.id, montageId));
        }
    } else if (montage && !montage.googleEventId && scheduledInstallationAt) {
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

	revalidatePath(MONTAGE_DASHBOARD_PATH);
	revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function addMontageNote(formData: FormData) {
	const user = await requireUser();

const montageIdRaw = formData.get('montageId');
const contentRaw = formData.get('content');
const attachmentTitleRaw = formData.get('attachmentTitle');
const fileField = formData.get('attachment');

const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
const content = typeof contentRaw === 'string' ? contentRaw.trim() : '';
const attachmentTitle = typeof attachmentTitleRaw === 'string' ? attachmentTitleRaw.trim() : '';

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
	createdBy: user.id,
	createdAt: now,
});

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
	await requireUser();
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

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function addMontageAttachment(formData: FormData) {
	const user = await requireUser();

	const montageIdRaw = formData.get('montageId');
	const titleRaw = formData.get('title');
	const noteIdRaw = formData.get('noteId');
	const taskIdRaw = formData.get('taskId');
	const fileField = formData.get('file');

	const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
	const noteId = typeof noteIdRaw === 'string' ? noteIdRaw.trim() : '';
	const taskId = typeof taskIdRaw === 'string' ? taskIdRaw.trim() : '';

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
	});

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
			templateId: montageChecklistItems.templateId
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
	finalSkirtingLength?: number | null;
	panelModel?: string | null;
    panelProductId?: number | null;
	skirtingModel?: string | null;
    skirtingProductId?: number | null;
	floorDetails?: string | null;
	skirtingDetails?: string | null;
	materialsEditHistory?: MaterialsEditHistoryEntry[];
};

export async function updateMontageMaterialDetails({
	montageId,
	materialDetails,
	finalPanelAmount,
	finalSkirtingLength,
	panelModel,
    panelProductId,
	skirtingModel,
    skirtingProductId,
	floorDetails,
	skirtingDetails,
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
			finalSkirtingLength,
			panelModel,
            panelProductId,
			skirtingModel,
            skirtingProductId,
			floorDetails,
			skirtingDetails,
			materialsEditHistory,
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

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

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function addMontageChecklistItem({ montageId, label, allowAttachment }: { montageId: string; label: string; allowAttachment: boolean }) {
	await requireUser();
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

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function deleteMontageChecklistItem({ montageId, itemId }: { montageId: string; itemId: string }) {
	await requireUser();
	await getMontageOrThrow(montageId);

	await db.delete(montageChecklistItems)
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)));

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function updateMontageChecklistItemLabel({ montageId, itemId, label }: { montageId: string; itemId: string; label: string }) {
	await requireUser();
	await getMontageOrThrow(montageId);

	await db.update(montageChecklistItems)
		.set({ label, updatedAt: new Date() })
		.where(and(eq(montageChecklistItems.id, itemId), eq(montageChecklistItems.montageId, montageId)));

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

import { products } from '@/lib/db/schema';

export async function getMontageProducts(type: 'panel' | 'skirting') {
    await requireUser();
    
    const results = await db.select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        imageUrl: products.imageUrl,
        stockStatus: products.stockStatus,
        stockQuantity: products.stockQuantity,
    })
    .from(products)
    .where(and(
        eq(products.isForMontage, true),
        eq(products.montageType, type)
    ));

    return results;
}

export async function updateMontageMeasurement({
	montageId,
	measurementDetails,
	floorArea,
	floorDetails,
	skirtingLength,
	skirtingDetails,
	panelModel,
    panelProductId,
	panelWaste,
	skirtingModel,
    skirtingProductId,
	skirtingWaste,
	modelsApproved,
	additionalInfo,
	sketchUrl,
	scheduledInstallationAt,
	scheduledInstallationEndAt,
    measurementInstallationMethod,
    measurementSubfloorCondition,
    measurementAdditionalWorkNeeded,
    measurementAdditionalWorkDescription,
    measurementSeparateSkirting,
}: {
	montageId: string;
	measurementDetails: string;
	floorArea: number | null;
	floorDetails: string;
	skirtingLength: number | null;
	skirtingDetails: string;
	panelModel: string;
    panelProductId?: number | null;
	panelWaste: number;
	skirtingModel: string;
    skirtingProductId?: number | null;
	skirtingWaste: number;
	modelsApproved: boolean;
	additionalInfo: string;
	sketchUrl?: string | null;
	scheduledInstallationAt: number | null;
	scheduledInstallationEndAt: number | null;
    measurementInstallationMethod?: 'click' | 'glue' | null;
    measurementSubfloorCondition?: string | null;
    measurementAdditionalWorkNeeded?: boolean;
    measurementAdditionalWorkDescription?: string | null;
    measurementSeparateSkirting?: boolean;
}) {
	await requireUser();

	await db
		.update(montages)
		.set({
			measurementDetails,
			materialDetails: measurementDetails, // Sync with materialDetails
			floorArea,
			floorDetails,
            measurementSeparateSkirting,
			skirtingLength,
			skirtingDetails,
			panelModel,
            panelProductId,
			panelWaste,
			skirtingModel,
            skirtingProductId,
			skirtingWaste,
			modelsApproved,
			additionalInfo,
			sketchUrl,
			scheduledInstallationAt: scheduledInstallationAt ? new Date(scheduledInstallationAt) : null,
			scheduledInstallationEndAt: scheduledInstallationEndAt ? new Date(scheduledInstallationEndAt) : null,
            measurementInstallationMethod,
            measurementSubfloorCondition,
            measurementAdditionalWorkNeeded,
            measurementAdditionalWorkDescription,
			finalPanelAmount: null, // Reset to auto-calculation on measurement update
			finalSkirtingLength: null, // Reset to auto-calculation on measurement update
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

	revalidatePath(MONTAGE_DASHBOARD_PATH);
	revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function updateMontageRealizationStatus({
    montageId,
    materialStatus,
    materialClaimType,
    installerStatus,
    installerId,
    measurerId,
    architectId
}: {
    montageId: string;
    materialStatus?: 'none' | 'ordered' | 'in_stock' | 'delivered';
    materialClaimType?: 'installer_pickup' | 'company_delivery' | 'courier' | 'client_pickup' | null;
    installerStatus?: 'none' | 'informed' | 'confirmed';
    installerId?: string | null;
    measurerId?: string | null;
    architectId?: string | null;
}) {
    const user = await requireUser();

    const updateData: { 
        materialStatus?: 'none' | 'ordered' | 'in_stock' | 'delivered'; 
        materialClaimType?: 'installer_pickup' | 'company_delivery' | 'courier' | 'client_pickup' | null;
        installerStatus?: 'none' | 'informed' | 'confirmed';
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
    address?: string;
    description?: string;
}) {
    const user = await requireUser();
    
    const trimmedName = data.clientName.trim();
    if (!trimmedName) {
        throw new Error('Podaj nazwę klienta.');
    }

    const displayId = await generateNextMontageId();
    const montageId = crypto.randomUUID();
    const now = new Date();

    // Auto-assign architect if the creator has the architect role
    const architectId = user.roles.includes('architect') ? user.id : null;

    await db.insert(montages).values({
        id: montageId,
        displayId,
        clientName: trimmedName,
        contactPhone: data.contactPhone?.trim() || null,
        address: data.address?.trim() || null,
        materialDetails: data.description?.trim() || null,
        status: 'lead',
        architectId,
        createdAt: now,
        updatedAt: now,
    });

    await logSystemEvent('create_lead', `Utworzono lead ${displayId} dla ${trimmedName}`, user.id);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
    return { status: 'success', montageId };
}

export async function createExtendedLead(formData: FormData) {
    const user = await requireUser();
    
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
    const floorArea = formData.get('floorArea') as string;
    const estimatedDate = formData.get('estimatedDate') as string;
    const notes = formData.get('notes') as string;
    const file = formData.get('file') as File;

    if (!clientName?.trim()) {
        throw new Error('Podaj nazwę klienta.');
    }

    // Create or update customer logic could be here, but for now we just store in montage
    // Similar to createMontage logic but simplified for lead

    const displayId = await generateNextMontageId();
    const montageId = crypto.randomUUID();
    const now = new Date();

    // Auto-assign architect if the creator has the architect role
    const architectId = user.roles.includes('architect') ? user.id : null;

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
        clientName: clientName.trim(),
        isCompany,
        companyName: companyName?.trim() || null,
        nip: nip?.trim() || null,
        contactPhone: phone?.trim() || null,
        contactEmail: email?.trim() || null,
        
        billingAddress: billingAddress || null,
        billingCity: billingCity?.trim() || null,
        billingPostalCode: billingPostalCode?.trim() || null,
        
        installationAddress: installationAddress || null,
        installationCity: shippingCity?.trim() || null,
        installationPostalCode: shippingPostalCode?.trim() || null,
        
        panelProductId: productId && productId !== 'none' ? parseInt(productId) : null,
        floorArea: floorArea ? parseFloat(floorArea) : null,
        forecastedInstallationDate: estimatedDate ? new Date(estimatedDate) : null,
        
        additionalInfo,
        
        status: 'lead',
        architectId,
        createdAt: now,
        updatedAt: now,
    });

    // Handle file upload
    if (file && file.size > 0) {
        try {
            await addAttachment(montageId, file, 'Rzut / Projekt (od Architekta)');
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
}
