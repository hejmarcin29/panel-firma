import { montageStatuses, type MontageStatus } from '@/lib/db/schema';

import type { StatusOption } from './types';

type StatusLabelConfig = {
	label: string;
	description: string;
};

export const statusLabels: Record<MontageStatus, StatusLabelConfig> = {
	lead: {
		label: 'Lead',
		description: 'Nowe zapytanie, oczekuje na kontakt.',
	},
	before_measurement: {
		label: 'Przed pomiarem',
		description: 'Ustal termin i szczegoly pomiaru.',
	},
	before_first_payment: {
		label: 'Przed 1. wplata',
		description: 'Klient zaakceptowal wycene, czekamy na wplate.',
	},
	before_installation: {
		label: 'Przed montazem',
		description: 'Przygotuj ekipe i materialy do montazu.',
	},
	before_final_invoice: {
		label: 'Przed FV i protokolem',
		description: 'Czekamy na odbior, fakture koncowa i protokol.',
	},
	completed: {
		label: 'Zakończono',
		description: 'Montaż zakończony, rozliczony i zamknięty.',
	},
};

export const statusOptions: StatusOption[] = montageStatuses.map((value) => ({
	value,
	label: statusLabels[value].label,
	description: statusLabels[value].description,
}));

export const SORT_OPTIONS = {
    SMART_DATE: 'smart-date',
    STAGNATION: 'stagnation',
    LAST_ACTIVITY: 'last-activity',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

export const sortLabels: Record<SortOption, string> = {
    [SORT_OPTIONS.SMART_DATE]: 'Termin Realizacji (Smart)',
    [SORT_OPTIONS.STAGNATION]: 'Najdłużej w etapie',
    [SORT_OPTIONS.LAST_ACTIVITY]: 'Ostatnia aktywność',
};
