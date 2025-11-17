import 'server-only';

import { getAppSetting, appSettingKeys } from '@/lib/settings';

type WfirmaConfig = {
	login: string;
	apiKey: string;
	tenant: string;
};

async function requireSetting(key: keyof typeof appSettingKeys, label: string) {
	const value = await getAppSetting(appSettingKeys[key]);
	if (!value || !value.trim()) {
		throw new Error(`Brakuje konfiguracji ${label}. Uzupelnij dane w ustawieniach panelu.`);
	}

	return value.trim();
}

export async function getWfirmaConfig(): Promise<WfirmaConfig> {
	const [login, apiKey, tenant] = await Promise.all([
		requireSetting('wfirmaLogin', 'WFIRMA_LOGIN'),
		requireSetting('wfirmaApiKey', 'WFIRMA_API_KEY'),
		requireSetting('wfirmaTenant', 'WFIRMA_TENANT'),
	]);

	return { login, apiKey, tenant };
}

export async function tryGetWfirmaConfig(): Promise<WfirmaConfig | null> {
	try {
		return await getWfirmaConfig();
	} catch {
		return null;
	}
}

export type { WfirmaConfig };
