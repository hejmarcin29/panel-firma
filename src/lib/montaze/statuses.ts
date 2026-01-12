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

        // Merge strategy:
        // 1. Keep custom statuses (non-system id)
        // 2. For system statuses, ALWAYS use the definition from DEFAULT_STATUSES to ensure consistency
        //    (unless we want to allow renaming system statuses - but for now let's prioritize structure)
        
        const mergedStatuses: MontageStatusDefinition[] = [];
        const systemIds = new Set(DEFAULT_STATUSES.filter(s => s.isSystem).map(s => s.id));
        
        // Add custom statuses from DB
        for (const status of statuses) {
            if (!systemIds.has(status.id)) {
                mergedStatuses.push(status);
            }
        }
        
        // Add all system statuses (overwrite any DB versions)
        for (const defaultStatus of DEFAULT_STATUSES) {
            if (defaultStatus.isSystem) {
                mergedStatuses.push(defaultStatus);
            }
        }

		return mergedStatuses.sort((a, b) => a.order - b.order);
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
