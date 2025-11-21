'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { documents, manualOrderItems, manualOrders, orderAttachments } from '@/lib/db/schema';
import { uploadOrderDocumentObject } from '@/lib/r2/storage';

import type {
	ManualOrderPayload,
	ManualOrderSource,
	Order,
	OrderItem,
	OrderItemPayload,
	OrderDocument,
	OrderAttachment,
} from './data';
import { buildTimelineEntries, normalizeStatus, statusOptions } from './utils';

const MONEY_SCALE = 100;
const QUANTITY_SCALE = 1000;
const VAT_SCALE = 100;
const MAX_ORDER_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

type ManualOrderRow = typeof manualOrders.$inferSelect;
type ManualOrderItemRow = typeof manualOrderItems.$inferSelect;
type ManualOrderInsert = typeof manualOrders.$inferInsert;
type ManualOrderItemInsert = typeof manualOrderItems.$inferInsert;
type DocumentRow = typeof documents.$inferSelect;
type OrderAttachmentRow = typeof orderAttachments.$inferSelect;
type OrderAttachmentInsert = typeof orderAttachments.$inferInsert;
type OrderAttachmentRowWithUploader = OrderAttachmentRow & {
	uploader: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

function toMinorUnits(value: number) {
	return Math.round(value * MONEY_SCALE);
}

function fromMinorUnits(value: number) {
	return value / MONEY_SCALE;
}

function toQuantityUnits(value: number) {
	return Math.round(value * QUANTITY_SCALE);
}

function fromQuantityUnits(value: number) {
	return value / QUANTITY_SCALE;
}

function toVatUnits(value: number) {
	return Math.round(value * VAT_SCALE);
}

function normalizePhone(value: string) {
	return value.replace(/\D+/g, '');
}

function fromVatUnits(value: number) {
	return value / VAT_SCALE;
}

function parseTaskOverrides(value: string | null | undefined): Record<string, boolean> {
	if (!value) {
		return {};
	}

	try {
		const parsed = JSON.parse(value);
		if (parsed && typeof parsed === 'object') {
			return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, boolean>>(
				(acc, [key, rawValue]) => {
					if (typeof rawValue === 'boolean') {
						acc[key] = rawValue;
					}
					return acc;
				},
				{},
			);
		}
	} catch {
		// Ignore malformed JSON and fall back to empty overrides.
	}

	return {};
}

function ensureValidOrderAttachmentFile(file: File) {
	if (!(file instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	if (file.size === 0) {
		throw new Error('Plik jest pusty.');
	}

	if (file.size > MAX_ORDER_ATTACHMENT_SIZE_BYTES) {
		throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 25 MB.');
	}
}

function mapDocumentRow(row: DocumentRow): OrderDocument {
	const issueDate = row.issueDate
		? new Date(row.issueDate instanceof Date ? row.issueDate : Number(row.issueDate)).toISOString()
		: null;

	return {
		id: row.id,
		type: row.type,
		status: row.status,
		number: row.number ?? null,
		issueDate,
		pdfUrl: row.pdfUrl ?? null,
	};
}

function mapItemRow(row: ManualOrderItemRow): OrderItem {
	return {
		id: row.id,
		product: row.product,
		quantity: fromQuantityUnits(row.quantity),
		unitPrice: fromMinorUnits(row.unitPrice),
		vatRate: fromVatUnits(row.vatRate),
		unitPricePerSquareMeter: row.unitPricePerSquareMeter
			? fromMinorUnits(row.unitPricePerSquareMeter)
			: 0,
		totalNet: fromMinorUnits(row.totalNet),
		totalGross: fromMinorUnits(row.totalGross),
	};
}

function mapAttachmentRow(row: OrderAttachmentRowWithUploader): OrderAttachment {
	const createdAt = row.createdAt
		? new Date(row.createdAt instanceof Date ? row.createdAt : Number(row.createdAt)).toISOString()
		: new Date().toISOString();

	return {
		id: row.id,
		title: row.title ?? null,
		url: row.url,
		createdAt,
		uploader: row.uploader
			? {
				id: row.uploader.id,
				name: row.uploader.name ?? null,
				email: row.uploader.email,
			}
			: null,
	};
}

function mapOrderRow(
	row: ManualOrderRow & {
		items: ManualOrderItemRow[];
		attachments: OrderAttachmentRowWithUploader[];
	},
): Order {
	const createdAt = new Date(row.createdAt ?? Date.now()).toISOString();
	const updatedAt = new Date(row.updatedAt ?? row.createdAt ?? Date.now()).toISOString();
	const taskOverrides = parseTaskOverrides(row.timelineTaskOverrides);

	const billing = {
		name: row.billingName,
		street: row.billingStreet,
		postalCode: row.billingPostalCode,
		city: row.billingCity,
		phone: row.billingPhone,
		email: row.billingEmail,
	};

	const rawShipping = row.shippingSameAsBilling
		? { ...billing, sameAsBilling: true }
		: {
			name: row.shippingName ?? '',
			street: row.shippingStreet ?? '',
			postalCode: row.shippingPostalCode ?? '',
			city: row.shippingCity ?? '',
			phone: row.shippingPhone ?? '',
			email: row.shippingEmail ?? '',
			sameAsBilling: false,
		};

	const items = row.items.map(mapItemRow);

	return {
		id: row.id,
		reference: row.reference,
		customer: billing.name,
		channel: row.channel,
		status: normalizeStatus(row.status),
		currency: row.currency,
		source: row.source as ManualOrderSource,
		sourceOrderId: row.sourceOrderId ?? null,
		requiresReview: Boolean(row.requiresReview),
		customerNote: row.notes?.trim() ? row.notes.trim() : null,
		createdAt,
		updatedAt,
		statuses: buildTimelineEntries(row.status, row.notes ?? '', createdAt),
		items,
		billing,
		shipping: rawShipping,
		totals: {
			totalNet: fromMinorUnits(row.totalNet),
			totalGross: fromMinorUnits(row.totalGross),
		},
		taskOverrides,
		attachments: row.attachments.map(mapAttachmentRow),
	};
}

function validateItems(items: OrderItemPayload[]) {
	if (items.length === 0) {
		throw new Error('Dodaj przynajmniej jedną pozycję zamówienia.');
	}

	for (const item of items) {
		if (!item.product.trim()) {
			throw new Error('Każda pozycja musi mieć nazwę.');
		}

		if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
			throw new Error('Ilość pozycji musi być dodatnia.');
		}

		if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
			throw new Error('Cena jednostkowa musi być liczbą nieujemną.');
		}

		if (!Number.isFinite(item.vatRate) || item.vatRate < 0) {
			throw new Error('Stawka VAT musi być liczbą nieujemną.');
		}

		if (!Number.isFinite(item.totalNet) || item.totalNet < 0) {
			throw new Error('Kwota netto pozycji musi być liczbą nieujemną.');
		}

		if (!Number.isFinite(item.totalGross) || item.totalGross < 0) {
			throw new Error('Kwota brutto pozycji musi być liczbą nieujemną.');
		}
	}
}

function validatePayload(payload: ManualOrderPayload) {
	if (!payload.reference.trim()) {
		throw new Error('Numer zamówienia jest wymagany.');
	}

	if (!payload.billing.name.trim()) {
		throw new Error('Imię i nazwisko na fakturę jest wymagane.');
	}

	if (!payload.billing.street.trim() || !payload.billing.postalCode.trim() || !payload.billing.city.trim()) {
		throw new Error('Adres rozliczeniowy musi być kompletny.');
	}

	const normalizedBillingPhone = normalizePhone(payload.billing.phone);
	if (normalizedBillingPhone.length < 9 || normalizedBillingPhone.length > 11) {
		throw new Error('Telefon rozliczeniowy powinien miec od 9 do 11 cyfr.');
	}
	payload.billing.phone = normalizedBillingPhone;

	if (!payload.billing.email.trim()) {
		throw new Error('E-mail rozliczeniowy jest wymagany.');
	}

	if (!payload.shipping.sameAsBilling) {
		if (
			!payload.shipping.name.trim() ||
			!payload.shipping.street.trim() ||
			!payload.shipping.postalCode.trim() ||
			!payload.shipping.city.trim() ||
			!payload.shipping.email.trim()
		) {
			throw new Error('Dane wysyłkowe muszą być kompletne.');
		}

		const normalizedShippingPhone = normalizePhone(payload.shipping.phone);
		if (normalizedShippingPhone.length < 9 || normalizedShippingPhone.length > 11) {
			throw new Error('Telefon wysylkowy powinien miec od 9 do 11 cyfr.');
		}
		payload.shipping.phone = normalizedShippingPhone;
	}

	validateItems(payload.items);
}

export async function getManualOrderById(id: string): Promise<Order | null> {
	const row = await db.query.manualOrders.findFirst({
		where: eq(manualOrders.id, id),
		with: {
			items: true,
			attachments: {
				orderBy: desc(orderAttachments.createdAt),
				with: {
					uploader: {
						columns: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	if (!row) {
		return null;
	}

	return mapOrderRow(row);
}

export async function getManualOrders(): Promise<Order[]> {
	const rows = await db.query.manualOrders.findMany({
		orderBy: desc(manualOrders.createdAt),
		with: {
			items: true,
			attachments: {
				orderBy: desc(orderAttachments.createdAt),
				with: {
					uploader: {
						columns: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	return rows.map(mapOrderRow);
}

export async function createManualOrder(payload: ManualOrderPayload): Promise<Order> {
	validatePayload(payload);

	const id = crypto.randomUUID();

	const billing = payload.billing;
	const shipping = payload.shipping.sameAsBilling ? payload.billing : payload.shipping;

	const orderTotals = payload.items.reduce(
		(acc, item) => ({
			net: acc.net + item.totalNet,
			gross: acc.gross + item.totalGross,
		}),
		{ net: 0, gross: 0 },
	);

	const orderRecord: ManualOrderInsert = {
		id,
		reference: payload.reference,
		status: normalizeStatus(payload.status),
		channel: payload.channel,
		notes: payload.notes,
		currency: payload.currency,
		source: payload.source ?? 'manual',
		sourceOrderId: payload.sourceOrderId ?? null,
		requiresReview: payload.requiresReview ?? false,
		totalNet: toMinorUnits(orderTotals.net),
		totalGross: toMinorUnits(orderTotals.gross),
		billingName: billing.name,
		billingStreet: billing.street,
		billingPostalCode: billing.postalCode,
		billingCity: billing.city,
		billingPhone: billing.phone,
		billingEmail: billing.email,
		shippingSameAsBilling: payload.shipping.sameAsBilling,
		shippingName: shipping.name,
		shippingStreet: shipping.street,
		shippingPostalCode: shipping.postalCode,
		shippingCity: shipping.city,
		shippingPhone: shipping.phone,
		shippingEmail: shipping.email,
	};

	await db.insert(manualOrders).values(orderRecord);

	for (const item of payload.items) {
		const itemRecord: ManualOrderItemInsert = {
			id: crypto.randomUUID(),
			orderId: id,
			product: item.product,
			quantity: toQuantityUnits(item.quantity),
			unitPrice: toMinorUnits(item.unitPrice),
			vatRate: toVatUnits(item.vatRate),
			unitPricePerSquareMeter: item.unitPricePerSquareMeter
				? toMinorUnits(item.unitPricePerSquareMeter)
				: null,
			totalNet: toMinorUnits(item.totalNet),
			totalGross: toMinorUnits(item.totalGross),
		};

		await db.insert(manualOrderItems).values(itemRecord);
	}

	const created = await getManualOrderById(id);

	if (!created) {
		throw new Error('Nie udało się pobrać świeżo utworzonego zamówienia.');
	}

	revalidatePath('/dashboard/orders');

	return created;
}

export async function confirmManualOrder(orderId: string): Promise<Order> {
	const [updatedRow] = await db
		.update(manualOrders)
		.set({
			requiresReview: false,
			updatedAt: new Date(),
		})
		.where(eq(manualOrders.id, orderId))
		.returning({ id: manualOrders.id });

	if (!updatedRow) {
		throw new Error('Nie znaleziono zamówienia do potwierdzenia.');
	}

	const updated = await getManualOrderById(orderId);

	if (!updated) {
		throw new Error('Nie udało się odczytać potwierdzonego zamówienia.');
	}

	revalidatePath('/dashboard/orders');

	return updated;
}

export async function getOrderDocuments(orderId: string): Promise<OrderDocument[]> {
	const rows = await db.query.documents.findMany({
		where: eq(documents.orderId, orderId),
		orderBy: desc(documents.createdAt),
	});

	return rows.map(mapDocumentRow);
}

export async function addOrderAttachment(formData: FormData): Promise<void> {
	const user = await requireUser();

	const orderIdRaw = formData.get('orderId');
	const titleRaw = formData.get('title');
	const fileField = formData.get('file');

	const orderId = typeof orderIdRaw === 'string' ? orderIdRaw.trim() : '';
	const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

	if (!orderId) {
		throw new Error('Brakuje identyfikatora zamówienia.');
	}

	if (!(fileField instanceof File)) {
		throw new Error('Wybierz plik do przesłania.');
	}

	ensureValidOrderAttachmentFile(fileField);

	const orderRecord = await db.query.manualOrders.findFirst({
		columns: {
			id: true,
			billingName: true,
		},
		where: eq(manualOrders.id, orderId),
	});

	if (!orderRecord) {
		throw new Error('Nie znaleziono zamówienia.');
	}

	const uploaded = await uploadOrderDocumentObject({
		customerName: orderRecord.billingName,
		file: fileField,
	});

	const now = new Date();
	const attachmentRecord: OrderAttachmentInsert = {
		id: crypto.randomUUID(),
		orderId: orderRecord.id,
		title: title ? title : null,
		url: uploaded.url,
		uploadedBy: user.id,
		createdAt: now,
	};

	await db.insert(orderAttachments).values(attachmentRecord);

	await db
		.update(manualOrders)
		.set({ updatedAt: now })
		.where(eq(manualOrders.id, orderRecord.id));

	revalidatePath(`/dashboard/orders/${orderRecord.id}`);
	revalidatePath('/dashboard/orders');
}

export async function updateManualOrderTaskOverride(
	orderId: string,
	taskId: string,
	completed: boolean | null,
): Promise<void> {
	await requireUser();

	if (!taskId) {
		throw new Error('Niepoprawny identyfikator zadania.');
	}

	const row = await db.query.manualOrders.findFirst({
		columns: {
			timelineTaskOverrides: true,
		},
		where: eq(manualOrders.id, orderId),
	});

	if (!row) {
		throw new Error('Nie znaleziono zamówienia do aktualizacji zadań.');
	}

	const overrides = parseTaskOverrides(row.timelineTaskOverrides);

	if (completed === null) {
		delete overrides[taskId];
	} else {
		overrides[taskId] = completed;
	}

	const serialized = Object.keys(overrides).length === 0 ? null : JSON.stringify(overrides);

	await db
		.update(manualOrders)
		.set({
			timelineTaskOverrides: serialized,
			updatedAt: new Date(),
		})
		.where(eq(manualOrders.id, orderId));

	revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function updateManualOrderStatus(orderId: string, nextStatus: string, note?: string): Promise<Order> {
	const user = await requireUser();
	const typedStatus = normalizeStatus(nextStatus);

	const orderRow = await db.query.manualOrders.findFirst({
		where: eq(manualOrders.id, orderId),
	});

	if (!orderRow) {
		throw new Error('Nie znaleziono zamówienia do aktualizacji.');
	}

	const trimmedNote = note?.trim() ?? '';
	const currentStatus = normalizeStatus(orderRow.status);
	const shouldUnsetReview = Boolean(orderRow.requiresReview) && typedStatus !== statusOptions[0];
	let combinedNotes = orderRow.notes ?? '';

	if (trimmedNote) {
		const actor = user.name?.trim() ? user.name : user.email;
		const timestamp = new Intl.DateTimeFormat('pl-PL', {
			dateStyle: 'short',
			timeStyle: 'short',
		}).format(new Date());
		const noteLine = `Status: ${typedStatus} (${timestamp})|${trimmedNote} — ${actor}`;
		combinedNotes = combinedNotes ? `${combinedNotes}\n${noteLine}` : noteLine;
	}

	const noChange =
		currentStatus === typedStatus &&
		!trimmedNote &&
		!shouldUnsetReview;

	if (noChange) {
		const existing = await getManualOrderById(orderId);
		if (!existing) {
			throw new Error('Nie udało się odczytać zamówienia po próbie aktualizacji.');
		}
		return existing;
	}

	const updateData: Partial<ManualOrderInsert> = {
		status: typedStatus,
		updatedAt: new Date(),
	};

	if (trimmedNote) {
		updateData.notes = combinedNotes;
	}

	if (shouldUnsetReview) {
		updateData.requiresReview = false;
	}

	await db
		.update(manualOrders)
		.set(updateData)
		.where(eq(manualOrders.id, orderId));

	const updated = await getManualOrderById(orderId);

	if (!updated) {
		throw new Error('Nie udało się odczytać zaktualizowanego zamówienia.');
	}

	revalidatePath('/dashboard/orders');
	revalidatePath(`/dashboard/orders/${orderId}`);

	return updated;
}

