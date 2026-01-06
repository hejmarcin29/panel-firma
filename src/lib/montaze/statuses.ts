import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { DEFAULT_STATUSES, type MontageStatusDefinition } from './statuses-shared';

export { getStatusLabel, getStatusGroup, DEFAULT_STATUSES, type MontageStatusDefinition } from './statuses-shared';

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
                    group: typeof item.group === 'string' ? item.group : 'LEJKI',
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
