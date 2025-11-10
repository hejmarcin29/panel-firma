'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { manualOrderItems, manualOrders } from '@/lib/db/schema';

import type {
	ManualOrderPayload,
	Order,
	OrderItem,
	OrderItemPayload,
} from './data';
import { buildTimelineEntries } from './utils';

const MONEY_SCALE = 100;
const QUANTITY_SCALE = 1000;
const VAT_SCALE = 100;

type ManualOrderRow = typeof manualOrders.$inferSelect;
type ManualOrderItemRow = typeof manualOrderItems.$inferSelect;
type ManualOrderInsert = typeof manualOrders.$inferInsert;
type ManualOrderItemInsert = typeof manualOrderItems.$inferInsert;

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

function fromVatUnits(value: number) {
	return value / VAT_SCALE;
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

function mapOrderRow(row: ManualOrderRow & { items: ManualOrderItemRow[] }): Order {
	const createdAt = new Date(row.createdAt ?? Date.now()).toISOString();
	const updatedAt = new Date(row.updatedAt ?? row.createdAt ?? Date.now()).toISOString();

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
		status: row.status,
		currency: row.currency,
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

	if (!/^[0-9]{9}$/.test(payload.billing.phone)) {
		throw new Error('Telefon rozliczeniowy musi mieć 9 cyfr.');
	}

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

		if (!/^[0-9]{9}$/.test(payload.shipping.phone)) {
			throw new Error('Telefon wysyłkowy musi mieć 9 cyfr.');
		}
	}

	validateItems(payload.items);
}

export async function getManualOrderById(id: string): Promise<Order | null> {
	const row = await db.query.manualOrders.findFirst({
		where: eq(manualOrders.id, id),
		with: {
			items: true,
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
		status: payload.status,
		channel: payload.channel,
		notes: payload.notes,
		currency: payload.currency,
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
