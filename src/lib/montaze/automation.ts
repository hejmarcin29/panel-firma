import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { type MontageStatus, montageStatuses } from '@/lib/db/schema';
import { SYSTEM_NOTIFICATIONS } from './notifications';

export type MontageAutomationRule = {
	checklistItemId: string;
	targetStatus: MontageStatus;
};

export async function isSystemAutomationEnabled(id: string): Promise<boolean> {
    const rawValue = await getAppSetting(appSettingKeys.montageNotifications);
    const definition = SYSTEM_NOTIFICATIONS.find(n => n.id === id);
    const defaultEnabled = definition?.defaultEnabled ?? true;

    if (!rawValue) {
        return defaultEnabled;
    }
    try {
        const settings = JSON.parse(rawValue) as Record<string, boolean>;
        return settings[id] ?? defaultEnabled;
    } catch {
        return defaultEnabled;
    }
}

export async function getMontageAutomationRules(): Promise<MontageAutomationRule[]> {
	const rawValue = await getAppSetting(appSettingKeys.montageAutomation);
	if (!rawValue) {
		return [];
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}

		const rules: MontageAutomationRule[] = [];
		for (const item of parsed) {
			if (
				typeof item === 'object' &&
				item !== null &&
				'checklistItemId' in item &&
				'targetStatus' in item &&
				typeof item.checklistItemId === 'string' &&
				typeof item.targetStatus === 'string' &&
				(montageStatuses as readonly string[]).includes(item.targetStatus)
			) {
				rules.push({
					checklistItemId: item.checklistItemId,
					targetStatus: item.targetStatus as MontageStatus,
				});
			}
		}
		return rules;
	} catch {
		return [];
	}
}

export async function setMontageAutomationRules(rules: MontageAutomationRule[], userId: string): Promise<void> {
	await setAppSetting({
		key: appSettingKeys.montageAutomation,
		value: JSON.stringify(rules),
		userId,
	});
}
