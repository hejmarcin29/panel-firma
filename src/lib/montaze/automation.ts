import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { type MontageStatus } from '@/lib/db/schema';
import { SYSTEM_NOTIFICATIONS } from './notifications';

export type MontageAutomationRule = {
	checklistItemId: string;
	targetStatus: MontageStatus;
};

export async function isSystemAutomationEnabled(id: string): Promise<boolean> {
    const settings = await getAppSetting<Record<string, boolean>>(appSettingKeys.montageNotifications, {});
    
    // Check if setting exists in DB
    if (id in settings) {
        return settings[id];
    }

    // Fallback to default from definition
    const def = SYSTEM_NOTIFICATIONS.find(n => n.id === id);
    return def?.defaultEnabled ?? false;
}

export async function isProcessAutomationEnabled(id: string): Promise<boolean> {
    const settings = await getAppSetting<Record<string, boolean>>(appSettingKeys.montageAutomationSettings, {});
    return settings[id] ?? false;
}

export async function getMontageAutomationRules(): Promise<MontageAutomationRule[]> {
    return await getAppSetting<MontageAutomationRule[]>(appSettingKeys.montageAutomation, []);
}

export async function setMontageAutomationRules(rules: MontageAutomationRule[], userId: string): Promise<void> {
    await setAppSetting(appSettingKeys.montageAutomation, rules, userId);
}
