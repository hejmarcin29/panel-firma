import 'server-only';

import { getAppSetting, appSettingKeys, type AppSettingKey } from '@/lib/settings';

type WfirmaConfig = {
	tenant: string;
	appKey: string;
	appSecret: string;
	accessKey: string;
	accessSecret: string;
};

async function requireSetting(key: AppSettingKey, label: string) {
	const value = await getAppSetting(key);
	if (!value || !value.trim()) {
		throw new Error(`Brakuje konfiguracji ${label}. Uzupelnij dane w ustawieniach panelu.`);
	}

	return value.trim();
}

export async function getWfirmaConfig(): Promise<WfirmaConfig> {
	const [tenant, appKey, appSecret, accessKey, accessSecret] = await Promise.all([
		requireSetting(appSettingKeys.wfirmaTenant, 'WFIRMA_TENANT'),
		requireSetting(appSettingKeys.wfirmaAppKey, 'WFIRMA_APP_KEY'),
		requireSetting(appSettingKeys.wfirmaAppSecret, 'WFIRMA_APP_SECRET'),
		requireSetting(appSettingKeys.wfirmaAccessKey, 'WFIRMA_ACCESS_KEY'),
		requireSetting(appSettingKeys.wfirmaAccessSecret, 'WFIRMA_ACCESS_SECRET'),
	]);

	return { tenant, appKey, appSecret, accessKey, accessSecret };
}

export async function tryGetWfirmaConfig(): Promise<WfirmaConfig | null> {
	try {
		return await getWfirmaConfig();
	} catch {
		return null;
	}
}

export type { WfirmaConfig };
