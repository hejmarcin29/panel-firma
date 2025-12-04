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
} from '@/lib/db/schema';
import { uploadMontageObject } from '@/lib/r2/storage';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';
import { getMontageAutomationRules } from '@/lib/montaze/automation';
import { logSystemEvent } from '@/lib/logging';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import type { MaterialsEditHistoryEntry } from './types';

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
}: CreateMontageInput): Promise<CreateMontageResult> {
	const user = await requireUser();

	const trimmedName = clientName.trim();
	if (!trimmedName) {
		throw new Error('Podaj nazwę klienta.');
	}

	const now = new Date();
	const montageId = crypto.randomUUID();
    const displayId = await generateNextMontageId();
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

    // Retry logic for unique displayId
    let saved = false;
    let attempts = 0;
    while (!saved && attempts < 3) {
        try {
            const displayId = await generateNextMontageId();
            await db.insert(montages).values({
                id: montageId,
                displayId,
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
                materialDetails: normalizedMaterialDetails,
                status: 'lead',
                createdAt: now,
                updatedAt: now,
            });
            saved = true;
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            if (message.includes('UNIQUE constraint failed: montages.display_id')) {
                attempts++;
                // Wait a bit before retrying to reduce collision chance
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw e;
            }
        }
    }

    if (!saved) {
        throw new Error('Nie udało się wygenerować unikalnego numeru montażu. Spróbuj ponownie.');
    }

	if (templates.length > 0) {
		await db.insert(montageChecklistItems).values(
			templates.map((template, index) => ({
				id: crypto.randomUUID(),
				montageId,
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

	await logSystemEvent('create_montage', `Utworzono montaż ${displayId} dla ${trimmedName}`, user.id);

	revalidatePath(MONTAGE_DASHBOARD_PATH);
    return { status: 'success', montageId };
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
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

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
	skirtingModel?: string | null;
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
	skirtingModel,
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
			finalPanelAmount,
			finalSkirtingLength,
			panelModel,
			skirtingModel,
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

export async function updateMontageMeasurement({
	montageId,
	measurementDetails,
	floorArea,
	floorDetails,
	skirtingLength,
	skirtingDetails,
	panelModel,
	panelWaste,
	skirtingModel,
	skirtingWaste,
	modelsApproved,
	additionalInfo,
	scheduledInstallationAt,
	scheduledInstallationEndAt,
}: {
	montageId: string;
	measurementDetails: string;
	floorArea: number | null;
	floorDetails: string;
	skirtingLength: number | null;
	skirtingDetails: string;
	panelModel: string;
	panelWaste: number;
	skirtingModel: string;
	skirtingWaste: number;
	modelsApproved: boolean;
	additionalInfo: string;
	scheduledInstallationAt: number | null;
	scheduledInstallationEndAt: number | null;
}) {
	await requireUser();

	await db
		.update(montages)
		.set({
			measurementDetails,
			floorArea,
			floorDetails,
			skirtingLength,
			skirtingDetails,
			panelModel,
			panelWaste,
			skirtingModel,
			skirtingWaste,
			modelsApproved,
			additionalInfo,
			scheduledInstallationAt: scheduledInstallationAt ? new Date(scheduledInstallationAt) : null,
			scheduledInstallationEndAt: scheduledInstallationEndAt ? new Date(scheduledInstallationEndAt) : null,
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

	revalidatePath(MONTAGE_DASHBOARD_PATH);
	revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
}

export async function updateMontageRealizationStatus({
    montageId,
    materialStatus,
    installerStatus
}: {
    montageId: string;
    materialStatus?: 'none' | 'ordered' | 'in_stock' | 'delivered';
    installerStatus?: 'none' | 'informed' | 'confirmed';
}) {
    const user = await requireUser();

    const updateData: { 
        materialStatus?: 'none' | 'ordered' | 'in_stock' | 'delivered'; 
        installerStatus?: 'none' | 'informed' | 'confirmed';
        updatedAt: Date;
    } = {
        updatedAt: new Date()
    };
    
    if (materialStatus !== undefined) updateData.materialStatus = materialStatus;
    if (installerStatus !== undefined) updateData.installerStatus = installerStatus;

    // If nothing to update (except updatedAt), return
    if (Object.keys(updateData).length <= 1) return;

    await db.update(montages)
        .set(updateData)
        .where(eq(montages.id, montageId));

    const changes: string[] = [];
    if (materialStatus) {
        const labels: Record<string, string> = {
            'none': 'Brak',
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

    await logSystemEvent(
        'montage.update_realization_status',
        `Zaktualizowano status realizacji dla montażu ${montageId}: ${changes.join(', ')}`,
        user.id
    );

    revalidatePath(`${MONTAGE_DASHBOARD_PATH}/${montageId}`);
    revalidatePath(MONTAGE_DASHBOARD_PATH);
}
