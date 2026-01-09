export function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatDate(date: string) {
	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(date));
}

export function formatNumber(value: number | null | undefined) {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return '--';
	}

	return new Intl.NumberFormat('pl-PL', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function computePackageArea(item: { unitPrice: number; unitPricePerSquareMeter: number }) {
	if (!item.unitPricePerSquareMeter || item.unitPricePerSquareMeter <= 0) {
		return null;
	}

	const area = item.unitPrice / item.unitPricePerSquareMeter;
	return Number.isFinite(area) && area > 0 ? area : null;
}

export function computeTotalArea(item: { unitPrice: number; unitPricePerSquareMeter: number; quantity: number }) {
	const perPackage = computePackageArea(item);
	if (perPackage === null) {
		return null;
	}

	const total = perPackage * item.quantity;
	return Number.isFinite(total) && total > 0 ? total : null;
}
