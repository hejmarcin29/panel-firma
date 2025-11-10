import type { OrderTimelineEntry, OrderTimelineState } from './data';

export const statusOptions = ['Nowe', 'W realizacji', 'Pakowanie', 'Wysłane', 'Dostarczone'] as const;
export const channelOptions = ['Sklep online', 'Marketplace', 'Telefon', 'Showroom'] as const;

const timelineStages = [
	{
		key: 'created',
		title: 'Zamówienie utworzone',
		description: 'Zamówienie zostało dodane ręcznie w panelu administratora.',
	},
	{
		key: 'Nowe',
		title: 'Weryfikacja i płatność',
		description: 'Zespół weryfikuje płatność oraz kompletność danych klienta.',
	},
	{
		key: 'W realizacji',
		title: 'Kompletacja zamówienia',
		description: 'Magazyn przygotowuje zamówienie do wysyłki.',
	},
	{
		key: 'Pakowanie',
		title: 'Pakowanie i kontrola jakości',
		description: 'Pracownicy pakują towar i przygotowują listy przewozowe.',
	},
	{
		key: 'Wysłane',
		title: 'Wydanie przewoźnikowi',
		description: 'Zamówienie przekazano do przewoźnika wraz z numerem śledzenia.',
	},
	{
		key: 'Dostarczone',
		title: 'Dostarczone do klienta',
		description: 'Klient potwierdził odebranie przesyłki.',
	},
] as const;

export function buildTimelineEntries(status: string, notes: string, createdAt: string): OrderTimelineEntry[] {
	const statusIndex = timelineStages.findIndex((stage) => stage.key === status);
	const activeIndex = statusIndex === -1 ? 1 : Math.max(statusIndex, 1);
	const createdAtDate = new Date(createdAt);

	const baseEntries: OrderTimelineEntry[] = timelineStages.map((stage, index) => {
		if (stage.key === 'created') {
			return {
				id: 'stage-created',
				title: stage.title,
				description: stage.description,
				timestamp: createdAtDate.toISOString(),
				state: 'completed',
			};
		}

		let state: OrderTimelineState = 'pending';
		if (index < activeIndex) {
			state = 'completed';
		} else if (index === activeIndex) {
			state = 'current';
		}

		const minutesOffset = activeIndex > index ? (activeIndex - index) * 20 : 0;
		const timestamp = state === 'pending'
			? null
			: new Date(createdAtDate.getTime() - minutesOffset * 60 * 1000).toISOString();

		return {
			id: `stage-${stage.key.toLowerCase().replace(/\s+/g, '-')}`,
			title: stage.title,
			description: stage.description,
			timestamp,
			state,
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
					};
				})
		: [];

	return [...baseEntries, ...noteEntries];
}