
import { type OrderStatus } from '@/lib/db/schema';
import type { OrderTimelineEntry, OrderTimelineState } from './data';

export type { OrderStatus };

export type StatusDefinition = {
    id: OrderStatus;
    label: string;
    description: string;
    color: string;
};

export const ORDER_STATUSES: StatusDefinition[] = [
    { 
        id: 'order.received', 
        label: 'Nowe / Inbox', 
        description: 'Wpadło ze sklepu lub formularza. Wymaga weryfikacji.',
        color: 'bg-zinc-100 text-zinc-900 border-zinc-200' 
    },
    { 
        id: 'order.pending_proforma', 
        label: 'Szkic / Oferta', 
        description: 'Koszyk zbudowany, oferta wysłana do klienta. Czekamy na akceptację.',
        color: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    { 
        id: 'order.proforma_issued', 
        label: 'Proforma Wysłana', 
        description: 'Klient ma dokument do płatności. Czekamy na przelew.',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
    },
    { 
        id: 'order.paid', 
        label: 'Opłacone / Zlecić', 
        description: 'Pieniądze na koncie. WYMAGANE ZAMÓWIENIE U DOSTAWCY.',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    { 
        id: 'order.forwarded_to_supplier', 
        label: 'U Dostawcy', 
        description: 'Wysłano maila do producenta. Czekamy na realizację.',
        color: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    { 
        id: 'order.fulfillment_confirmed', 
        label: 'Wysłane / Tracking', 
        description: 'Towar fizycznie w drodze. Jest numer listu przewozowego.',
        color: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
     { 
        id: 'order.final_invoice', 
        label: 'Faktura Wysłana', 
        description: 'Dokument końcowy wystawiony. Oczekiwanie na ewentualną dopłatę.',
        color: 'bg-sky-50 text-sky-700 border-sky-200' 
    },
    { 
        id: 'order.closed', 
        label: 'Zakończone', 
        description: 'Temat zamknięty i rozliczony.',
        color: 'bg-zinc-100 text-zinc-500 border-zinc-200' 
    },
];

export const statusOptions = ORDER_STATUSES.map(s => s.label);

export function getStatusLabel(id: string): string {
    return ORDER_STATUSES.find(s => s.id === id)?.label ?? id;
}

export function getStatusColor(id: string): string {
     return ORDER_STATUSES.find(s => s.id === id)?.color ?? 'bg-zinc-100';
}

const legacyStatusMap: Record<string, string> = {
    'Zamówienie utworzone': 'order.received',
	'Nowe': 'order.received',
    'Weryfikacja i płatność': 'order.pending_proforma',
	'W realizacji': 'order.forwarded_to_supplier',
	'Pakowanie': 'order.forwarded_to_supplier',
    'Kompletacja zamówienia': 'order.forwarded_to_supplier',
    'Wydanie przewoźnikowi': 'order.fulfillment_confirmed',
	'Wysłane': 'order.fulfillment_confirmed',
    'Dostarczone do klienta': 'order.closed', // or final_invoice?
	'Dostarczone': 'order.closed',
    'Zakończone': 'order.closed'
};

export function normalizeStatus(status: string): string {
	const trimmed = status.trim();
    
    // Check if it's already a valid new ID
    if (ORDER_STATUSES.some(s => s.id === trimmed)) {
        return trimmed;
    }

    // Check legacy map
	if (legacyStatusMap[trimmed]) {
		return legacyStatusMap[trimmed];
	}

    // Default
	return ORDER_STATUSES[0].id; // 'order.received'
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
		tasks: ['Proforma wystawiona i wysłana', 'Proforma opłacona'],
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

export function buildTimelineEntries(status: string, notes: string, createdAt: string, type: 'production' | 'sample' = 'production'): OrderTimelineEntry[] {
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

		// Special handling for samples
		let tasks = stage.tasks;
		if (type === 'sample' && stage.key === 'Weryfikacja i płatność') {
			// For samples (Tpay), we don't issue proformas.
			// We replace the tasks with a simple "Payment confirmed" check.
			tasks = ['Płatność Tpay potwierdzona'];
			
			// If we are at this stage or past it, it's effectively done because it's Tpay
			if (state === 'pending' && activeIndex > index) {
				state = 'completed';
			}
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
			tasks: tasks.map((task) => ({
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

export function parseTaskOverrides(value: string | null | undefined): Record<string, boolean> {
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
