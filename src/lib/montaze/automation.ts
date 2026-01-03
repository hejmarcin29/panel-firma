import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { type MontageStatus, montageStatuses } from '@/lib/db/schema';
import { SYSTEM_NOTIFICATIONS } from './notifications';

export type MontageAutomationRule = {
	checklistItemId: string;
	targetStatus: MontageStatus;
};

export async function isSystemAutomationEnabled(id: string): Promise<boolean> {
    // Disabled by default as per "Manual Control" policy
    return false;
}

export async function isProcessAutomationEnabled(id: string): Promise<boolean> {
    // Disabled by default as per "Manual Control" policy
    return false;
}

export async function getMontageAutomationRules(): Promise<MontageAutomationRule[]> {
    // No automation rules
	return [];
}

export async function setMontageAutomationRules(rules: MontageAutomationRule[], userId: string): Promise<void> {
    // Do nothing
}
