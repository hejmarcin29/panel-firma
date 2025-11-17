import type { OrderTimelineEntry, OrderTimelineState } from './data';

export const statusOptions = [
	'Zamówienie utworzone',
	'Weryfikacja i płatność',
	'Kompletacja zamówienia',
	'Wydanie przewoźnikowi',
	'Dostarczone do klienta',
] as const;

export type StatusOption = (typeof statusOptions)[number];

const legacyStatusMap: Record<string, StatusOption> = {
	Nowe: 'Weryfikacja i płatność',
	'W realizacji': 'Kompletacja zamówienia',
	Pakowanie: 'Kompletacja zamówienia',
	'Wysłane': 'Wydanie przewoźnikowi',
	'Dostarczone': 'Dostarczone do klienta',
};

export function normalizeStatus(status: string): StatusOption {
	const trimmed = status.trim();
	if (legacyStatusMap[trimmed]) {
		return legacyStatusMap[trimmed];
	}
	if (statusOptions.includes(trimmed as StatusOption)) {
		return trimmed as StatusOption;
	}
	return statusOptions[0];
}
export const channelOptions = ['Sklep online', 'Marketplace', 'Telefon', 'Showroom'] as const;

const timelineStages = [
	{
		key: 'Zamówienie utworzone',
		title: 'Zamówienie utworzone',
		description: 'Zamówienie zostało dodane ręcznie w panelu administratora.',
		tasks: [] as string[],
	},
	{
		key: 'Weryfikacja i płatność',
		title: 'Weryfikacja i płatność',
		description: 'Zespół weryfikuje płatność oraz kompletność danych klienta.',
		tasks: ['Proforma wystawiona', 'Proforma wysłana', 'Zaliczkowa wysłana'],
	},
	{
		key: 'Kompletacja zamówienia',
		title: 'Kompletacja zamówienia',
		description: 'Magazyn przygotowuje zamówienie do wysyłki.',
		tasks: ['Zamówienie przyjęte przez magazyn', 'Wysłane zamówienie'],
	},
	{
		key: 'Wydanie przewoźnikowi',
		title: 'Wydanie przewoźnikowi',
		description: 'Zamówienie przekazano do przewoźnika wraz z numerem śledzenia.',
		tasks: [] as string[],
	},
	{
		key: 'Dostarczone do klienta',
		title: 'Dostarczone do klienta',
		description: 'Klient potwierdził odebranie przesyłki.',
		tasks: ['Wystawiono fakturę końcową', 'Opłacono fakturę kosztową'],
	},
] as const;

export function buildTimelineEntries(status: string, notes: string, createdAt: string): OrderTimelineEntry[] {
	const normalizedStatus = normalizeStatus(status);
	const statusIndex = timelineStages.findIndex((stage) => stage.key === normalizedStatus);
	const activeIndex = statusIndex === -1 ? 0 : statusIndex;
	const createdAtDate = new Date(createdAt);

	const baseEntries: OrderTimelineEntry[] = timelineStages.map((stage, index) => {
		let state: OrderTimelineState = 'pending';
		if (index < activeIndex) {
			state = 'completed';
		} else if (index === activeIndex) {
			state = 'current';
		}

		let timestamp: string | null = null;
		if (index === 0) {
			timestamp = createdAtDate.toISOString();
		} else if (state !== 'pending') {
			const minutesOffset = activeIndex > index ? (activeIndex - index) * 20 : 0;
			timestamp = new Date(createdAtDate.getTime() - minutesOffset * 60 * 1000).toISOString();
		}

		return {
			id: `stage-${stage.key.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
			title: stage.title,
			description: stage.description,
			timestamp,
			state,
			statusKey: stage.key,
			tasks: stage.tasks.map((task) => ({
				id: `${stage.key.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${task.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
				label: task,
				completed: false,
				autoCompleted: false,
				manualOverride: null,
				completionSource: 'auto',
			})),
		};
	});

	const trimmedNotes = notes.trim();
	const noteEntries = trimmedNotes
		? trimmedNotes
				.split('\n')
				.filter(Boolean)
				.map((line, index) => {
					const [rawTitle, rawDescription] = line.split('|').map((part) => part?.trim() ?? '');

					return {
						id: `note-${index}`,
						title: rawTitle || `Etap dodatkowy ${index + 1}`,
						description: rawDescription || 'Brak dodatkowego opisu.',
						timestamp: null,
						state: 'pending' as const,
						statusKey: null,
						tasks: [],
					};
				})
		: [];

	return [...baseEntries, ...noteEntries];
}