import 'server-only';

import { type MontageStatus } from '@/lib/db/schema';

export type MontageAutomationRule = {
	checklistItemId: string;
	targetStatus: MontageStatus;
};

export async function isSystemAutomationEnabled(): Promise<boolean> {
    // Disabled by default as per "Manual Control" policy
    return false;
}

export async function isProcessAutomationEnabled(): Promise<boolean> {
    // Disabled by default as per "Manual Control" policy
    return false;
}

export async function getMontageAutomationRules(): Promise<MontageAutomationRule[]> {
    // No automation rules
	return [];
}

export async function setMontageAutomationRules(): Promise<void> {
    // Do nothing
}
