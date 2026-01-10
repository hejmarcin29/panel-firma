import type { ManualOrderPayload } from '@/app/dashboard/crm/ordersWP/data';

import type { WooMetaData, WooOrder } from './types';

// Converts the WooCommerce REST/webhook order payload into our ManualOrderPayload format.
// Assumes meta_data entries may contain polish labels such as "Zawartość opakowania" or "Ilość (m2)".

const STATUS_MAP: Record<string, string> = {
	pending: 'Nowe',
	processing: 'W realizacji',
	onhold: 'Nowe',
	completed: 'Pakowanie',
	shipped: 'Wysłane',
	delivered: 'Dostarczone',
	refunded: 'Nowe',
	cancelled: 'Nowe',
	failed: 'Nowe',
};

const FALLBACK_STATUS = 'Nowe';
const DEFAULT_CHANNEL = 'WooCommerce';

function toNumber(value: unknown): number {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : NaN;
	}

	if (typeof value === 'string') {
		const normalized = value
			.replace(/\s+/g, '')
			.replace(/[^0-9.,-]/g, '')
			.replace(/,/g, '.')
			.trim();
		const match = normalized.match(/-?\d+(?:\.\d+)?/);
		return match ? Number.parseFloat(match[0]) : NaN;
	}

	return NaN;
}

function extractMeta(meta: WooMetaData[], keys: string[]): WooMetaData | undefined {
	const lowered = keys.map((key) => key.toLowerCase());
	return meta.find((entry) => {
		const key = entry.display_key ?? entry.key;
		const safeKey = String(key ?? '').toLowerCase();
		return lowered.some((candidate) => safeKey.includes(candidate));
	});
}

function extractMetaNumber(meta: WooMetaData[], keys: string[]): number | null {
	const entry = extractMeta(meta, keys);
	if (!entry) {
		return null;
	}

	const raw = entry.display_value ?? entry.value;
	const numeric = toNumber(raw);
	return Number.isFinite(numeric) ? numeric : null;
}

function formatCurrencyCode(value: string | null | undefined): string {
	if (!value) {
		return 'PLN';
	}

	const trimmed = value.trim().toUpperCase();
	return trimmed.length ? trimmed : 'PLN';
}

function buildAddress(address: WooOrder['billing']): ManualOrderPayload['billing'] {
	const fullName = [address.first_name, address.last_name].filter(Boolean).join(' ').trim();

	return {
		name: fullName || address.company || 'Klient anonimowy',
		street: [address.address_1, address.address_2].filter(Boolean).join(' ').trim(),
		postalCode: address.postcode?.trim() ?? '',
		city: address.city?.trim() ?? '',
		phone: address.phone?.trim() ?? '',
		email: address.email?.trim() ?? '',
	};
}

function addressesMatch(billing: ManualOrderPayload['billing'], shipping: ManualOrderPayload['shipping']): boolean {
	return (
		billing.name === shipping.name &&
		billing.street === shipping.street &&
		billing.postalCode === shipping.postalCode &&
		billing.city === shipping.city &&
		billing.phone === shipping.phone &&
		billing.email === shipping.email
	);
}

function normalizeShipping(
	billing: ManualOrderPayload['billing'],
	shipping: ManualOrderPayload['shipping'],
): ManualOrderPayload['shipping'] {
	const normalised: ManualOrderPayload['shipping'] = {
		name: shipping.name || billing.name,
		street: shipping.street || billing.street,
		postalCode: shipping.postalCode || billing.postalCode,
		city: shipping.city || billing.city,
		phone: shipping.phone || billing.phone,
		email: shipping.email || billing.email,
		sameAsBilling: false,
	};

	return normalised;
}

export function mapWooOrderToManualOrderPayload(order: WooOrder): ManualOrderPayload {
	const status = STATUS_MAP[order.status] ?? FALLBACK_STATUS;
	const billing = buildAddress(order.billing);
	const shippingAddress = buildAddress(order.shipping);
	const shipping = normalizeShipping(billing, {
		...shippingAddress,
		sameAsBilling: false,
	});

	const items = order.line_items.map((item) => {
		const quantity = item.quantity || 1;
		const totalNet = toNumber(item.total) || 0;
		const totalTax = toNumber(item.total_tax) || 0;
		const unitNet = quantity > 0 ? totalNet / quantity : totalNet;

		const packageArea = extractMetaNumber(item.meta_data, ['opak', 'package', 'zawartosc', 'content']);
		const totalArea = extractMetaNumber(item.meta_data, ['m2', 'm^2', 'metry kw', 'metry', 'm²', 'sqm']);
		const areaPerPackage = packageArea ?? (totalArea && quantity > 0 ? totalArea / quantity : null);
		const pricePerSquareMeter = areaPerPackage && areaPerPackage > 0 ? unitNet / areaPerPackage : totalArea && totalArea > 0 ? totalNet / totalArea : 0;

		const vatRate = totalNet > 0 ? (totalTax / totalNet) * 100 : 0;

		return {
			product: item.name,
			quantity,
			unitPrice: Number.isFinite(unitNet) ? Number(unitNet) : 0,
			vatRate: Number.isFinite(vatRate) ? Number(vatRate) : 0,
			unitPricePerSquareMeter: Number.isFinite(pricePerSquareMeter) ? Number(pricePerSquareMeter) : 0,
			totalNet: Number.isFinite(totalNet) ? Number(totalNet) : 0,
			totalGross: Number.isFinite(totalNet + totalTax) ? Number(totalNet + totalTax) : 0,
		};
	});

	const shippingItems = (order.shipping_lines ?? []).map((shippingLine) => {
		const net = toNumber(shippingLine.total) || 0;
		const tax = toNumber(shippingLine.total_tax) || 0;
		const quantity = 1;
		const vatRate = net > 0 ? (tax / net) * 100 : 0;

		return {
			product: shippingLine.method_title || 'Wysyłka',
			quantity,
			unitPrice: Number.isFinite(net) ? Number(net) : 0,
			vatRate: Number.isFinite(vatRate) ? Number(vatRate) : 0,
			unitPricePerSquareMeter: 0,
			totalNet: Number.isFinite(net) ? Number(net) : 0,
			totalGross: Number.isFinite(net + tax) ? Number(net + tax) : 0,
		};
	});

	const allItems = [...items, ...shippingItems];

	const notes = [order.note, order.customer_note]
		.filter((value): value is string => Boolean(value && value.trim().length))
		.map((value) => value.trim())
		.join('\n');

	const sameAsBilling = addressesMatch(billing, shipping);
	const shippingWithFlag = {
		...shipping,
		sameAsBilling,
	};

	const paymentMethod = order.payment_method_title || order.payment_method || 'Nieznana';
	const shippingMethod = order.shipping_lines?.[0]?.method_title || 'Nieznana';

	return {
		reference: order.number,
		status,
		channel: DEFAULT_CHANNEL,
		notes,
		currency: formatCurrencyCode(order.currency),
		billing,
		shipping: shippingWithFlag,
		items: allItems,
		source: 'woocommerce',
		sourceOrderId: order.id !== undefined ? String(order.id) : order.number ?? null,
		requiresReview: true,
		paymentMethod,
		shippingMethod,
	};
}
