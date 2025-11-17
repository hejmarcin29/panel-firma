'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageNotes,
	montageTasks,
	montages,
	type MontageStatus,
	montageStatuses,
} from '@/lib/db/schema';
import { uploadMontageObject } from '@/lib/r2/storage';

const MONTAGE_DASHBOARD_PATH = '/dashboard/montaze';
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

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
	address?: string;
};

export async function createMontage({ clientName, contactPhone, contactEmail, address }: CreateMontageInput) {
	await requireUser();

	const trimmedName = clientName.trim();
	if (!trimmedName) {
		throw new Error('Podaj nazwę klienta.');
	}

	const now = new Date();

	await db.insert(montages).values({
		id: crypto.randomUUID(),
		clientName: trimmedName,
		contactPhone: contactPhone?.trim() ?? null,
		contactEmail: contactEmail?.trim() ?? null,
		address: address?.trim() ?? null,
		status: 'lead',
		createdAt: now,
		updatedAt: now,
	});

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

type AddMontageNoteInput = {
	montageId: string;
	content: string;
};

export async function addMontageNote({ montageId, content }: AddMontageNoteInput) {
	const user = await requireUser();
	const trimmed = content.trim();

	if (!trimmed) {
		throw new Error('Notatka nie może być pusta.');
	}

	const now = new Date();

	await db.insert(montageNotes).values({
		id: crypto.randomUUID(),
		montageId,
		content: trimmed,
		createdBy: user.id,
		createdAt: now,
	});

	await touchMontage(montageId);
	revalidatePath(MONTAGE_DASHBOARD_PATH);
}

export async function addMontageAttachment(formData: FormData) {
	const user = await requireUser();

	const montageIdRaw = formData.get('montageId');
	const titleRaw = formData.get('title');
	const fileField = formData.get('file');

	const montageId = typeof montageIdRaw === 'string' ? montageIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

	if (!montageId) {
		throw new Error('Brakuje identyfikatora montaży.');
	}

	if (!(fileField instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	if (fileField.size === 0) {
		throw new Error('Plik jest pusty.');
	}

	if (fileField.size > MAX_ATTACHMENT_SIZE_BYTES) {
		throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 25 MB.');
	}

	const montageRecord = await db.query.montages.findFirst({
		where: (table, { eq }) => eq(table.id, montageId),
	});

	if (!montageRecord) {
		throw new Error('Nie znaleziono montaży.');
	}

	const uploaded = await uploadMontageObject({
		clientName: montageRecord.clientName,
		file: fileField,
	});

	const now = new Date();

	await db.insert(montageAttachments).values({
		id: crypto.randomUUID(),
		montageId: montageRecord.id,
		title: title ? title : null,
		url: uploaded.url,
		uploadedBy: user.id,
		createdAt: now,
	});

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
