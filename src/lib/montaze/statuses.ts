import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';

export type MontageStatusDefinition = {
	id: string;
	label: string;
	description: string;
	order: number;
    isSystem?: boolean;
};

const DEFAULT_STATUSES: MontageStatusDefinition[] = [
	{
		id: 'lead',
		label: 'Lead',
		description: 'Nowe zapytanie, oczekuje na kontakt.',
		order: 0,
        isSystem: true,
	},
	{
		id: 'before_measurement',
		label: 'Przed pomiarem',
		description: 'Ustal termin i szczegoly pomiaru.',
		order: 1,
        isSystem: true,
	},
	{
		id: 'before_first_payment',
		label: 'Przed 1. wplata',
		description: 'Klient zaakceptowal wycene, czekamy na wplate.',
		order: 2,
        isSystem: true,
	},
	{
		id: 'before_installation',
		label: 'Przed montazem',
		description: 'Przygotuj ekipe i materialy do montazu.',
		order: 3,
        isSystem: true,
	},
	{
		id: 'before_final_invoice',
		label: 'Przed FV i protokolem',
		description: 'Czekamy na odbior, fakture koncowa i protokol.',
		order: 4,
        isSystem: true,
	},
	{
		id: 'completed',
		label: 'Zakończono',
		description: 'Montaż zakończony, rozliczony i zamknięty.',
		order: 5,
        isSystem: true,
	},
];

export async function getMontageStatusDefinitions(): Promise<MontageStatusDefinition[]> {
	const rawValue = await getAppSetting(appSettingKeys.montageStatuses);
	if (!rawValue) {
		return DEFAULT_STATUSES;
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (!Array.isArray(parsed)) {
			return DEFAULT_STATUSES;
		}

		const statuses: MontageStatusDefinition[] = [];
		for (const item of parsed) {
			if (
				typeof item === 'object' &&
				item !== null &&
				'id' in item &&
				'label' in item &&
				'description' in item &&
				typeof item.id === 'string' &&
				typeof item.label === 'string' &&
				typeof item.description === 'string'
			) {
				statuses.push({
					id: item.id,
					label: item.label,
					description: item.description,
					order: typeof item.order === 'number' ? item.order : 0,
                    isSystem: Boolean(item.isSystem),
				});
			}
		}
        
        if (statuses.length === 0) {
            return DEFAULT_STATUSES;
        }

		return statuses.sort((a, b) => a.order - b.order);
	} catch {
		return DEFAULT_STATUSES;
	}
}

export async function setMontageStatusDefinitions(statuses: MontageStatusDefinition[], userId: string): Promise<void> {
    // Ensure IDs are unique and valid
    const sanitized = statuses.map((s, index) => ({
        ...s,
        id: s.id.trim() || crypto.randomUUID(),
        label: s.label.trim(),
        order: index
    })).filter(s => s.label.length > 0);

    if (sanitized.length === 0) {
        throw new Error("Lista statusów nie może być pusta.");
    }

	await setAppSetting({
		key: appSettingKeys.montageStatuses,
		value: JSON.stringify(sanitized),
		userId,
	});
}
