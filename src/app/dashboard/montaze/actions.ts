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
} from '@/lib/db/schema';
import { uploadMontageObject } from '@/lib/r2/storage';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';

const MONTAGE_DASHBOARD_PATH = '/dashboard/montaze';
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

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
}: {
	montage: typeof montages.$inferSelect;
	file: File;
	uploadedBy: string;
	title: string | null;
	noteId?: string | null;
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
		title,
		url: uploaded.url,
		uploadedBy,
		createdAt: now,
	});

	return attachmentId;
}

function ensureStatus(value: string): MontageStatus {
	if ((montageStatuses as readonly string[]).includes(value)) {
		return value as MontageStatus;
	}
	throw new Error('Nieznany status montaży.');
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
	scheduledInstallationDate?: string;
	materialDetails?: string;
};

export async function createMontage({
	clientName,
	contactPhone,
	contactEmail,
	billingAddress,
	installationAddress,
	billingCity,
	installationCity,
	scheduledInstallationDate,
	materialDetails,
}: CreateMontageInput) {
	await requireUser();

	const trimmedName = clientName.trim();
	if (!trimmedName) {
		throw new Error('Podaj nazwę klienta.');
	}

	const now = new Date();
	const montageId = crypto.randomUUID();
	const templates = await getMontageChecklistTemplates();
	const normalizedBilling = billingAddress?.trim() ? billingAddress.trim() : null;
	const normalizedInstallation = installationAddress?.trim() ? installationAddress.trim() : null;
	const normalizedBillingCity = billingCity?.trim() ? billingCity.trim() : null;
	const normalizedInstallationCity = installationCity?.trim() ? installationCity.trim() : null;
	const normalizedMaterialDetails = materialDetails?.trim() ? materialDetails.trim() : null;
	const fallbackAddress = normalizedInstallation ?? normalizedBilling;
	const fallbackCity = normalizedInstallationCity ?? normalizedBillingCity;
	const fallbackAddressLine = [fallbackAddress, fallbackCity].filter(Boolean).join(', ') || null;

	let scheduledInstallationAt: Date | null = null;
	if (scheduledInstallationDate) {
		const parsed = new Date(`${scheduledInstallationDate}T00:00:00`);
		if (!Number.isNaN(parsed.getTime())) {
			scheduledInstallationAt = parsed;
		}
	}

	await db.insert(montages).values({
		id: montageId,
		clientName: trimmedName,
		contactPhone: contactPhone?.trim() ?? null,
		contactEmail: contactEmail?.trim() ?? null,
		address: fallbackAddressLine,
		billingAddress: normalizedBilling,
		installationAddress: normalizedInstallation,
		billingCity: normalizedBillingCity,
		installationCity: normalizedInstallationCity,
		scheduledInstallationAt,
		materialDetails: normalizedMaterialDetails,
		status: 'lead',
		createdAt: now,
		updatedAt: now,
	});

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

	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type UpdateMontageStatusInput = {
	montageId: string;
	status: MontageStatus | string;
};

export async function updateMontageStatus({ montageId, status }: UpdateMontageStatusInput) {
	await requireUser();
	const resolved = ensureStatus(status);

	await db
		.update(montages)
		.set({ status: resolved, updatedAt: new Date() })
		.where(eq(montages.id, montageId));

	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type UpdateMontageContactDetailsInput = {
	montageId: string;
	clientName: string;
	contactPhone?: string;
	contactEmail?: string;
	scheduledInstallationDate?: string;
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
			updatedAt: new Date(),
		})
		.where(eq(montages.id, montageId));

	revalidatePath(MONTAGE_DASHBOARD_PATH);
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
};

export async function addMontageTask({ montageId, title }: AddMontageTaskInput) {
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
	const fileField = formData.get('file');

	const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
	const noteId = typeof noteIdRaw === 'string' ? noteIdRaw.trim() : '';

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
		.select({ id: montageChecklistItems.id })
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

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

type UpdateMontageMaterialsInput = {
	montageId: string;
	materialDetails: string;
};

export async function updateMontageMaterialDetails({ montageId, materialDetails }: UpdateMontageMaterialsInput) {
	await requireUser();

	const sanitized = materialDetails.trim();

	await db
		.update(montages)
		.set({ materialDetails: sanitized ? sanitized : null, updatedAt: new Date() })
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
