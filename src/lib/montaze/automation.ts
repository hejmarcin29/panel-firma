import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { type MontageStatus } from '@/lib/db/schema';
import { SYSTEM_NOTIFICATIONS } from './notifications';

export type MontageAutomationRule = {
	checklistItemId: string;
	targetStatus: MontageStatus;
};

export async function isSystemAutomationEnabled(id: string): Promise<boolean> {
    const settingStr = await getAppSetting(appSettingKeys.montageNotifications);
    const settings = settingStr ? JSON.parse(settingStr) as Record<string, boolean> : {};
    
    // Check if setting exists in DB
    if (id in settings) {
        return settings[id];
    }

    // Fallback to default from definition
    const def = SYSTEM_NOTIFICATIONS.find(n => n.id === id);
    return def?.defaultEnabled ?? false;
}

export async function isProcessAutomationEnabled(id: string): Promise<boolean> {
    const settingStr = await getAppSetting(appSettingKeys.montageAutomationSettings);
    const settings = settingStr ? JSON.parse(settingStr) as Record<string, boolean> : {};
    return settings[id] ?? false;
}

export async function getMontageAutomationRules(): Promise<MontageAutomationRule[]> {
    const settingStr = await getAppSetting(appSettingKeys.montageAutomation);
    return settingStr ? JSON.parse(settingStr) as MontageAutomationRule[] : [];
}

export async function setMontageAutomationRules(rules: MontageAutomationRule[], userId: string): Promise<void> {
    await setAppSetting(appSettingKeys.montageAutomation, rules, userId);
}
