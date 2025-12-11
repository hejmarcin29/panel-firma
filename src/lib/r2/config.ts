import 'server-only';

import { appSettingKeys, getAppSetting } from '@/lib/settings';

export type R2Config = {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	endpoint: string;
	publicBaseUrl: string;
	apiToken: string | null;
};

async function requireSetting(key: (typeof appSettingKeys)[keyof typeof appSettingKeys], label: string): Promise<string> {
	const value = await getAppSetting(key);
	if (!value || !value.trim()) {
		throw new Error(`Brakuje konfiguracji ${label}. Uzupelnij dane w ustawieniach Cloudflare R2.`);
	}

	return value.trim();
}

export async function getR2Config(): Promise<R2Config> {
	const [accountId, accessKeyId, secretAccessKey, bucketName, endpoint, publicBaseUrl, apiToken] = await Promise.all([
		requireSetting(appSettingKeys.r2AccountId, 'CLOUDFLARE_R2_ACCOUNT_ID'),
		requireSetting(appSettingKeys.r2AccessKeyId, 'CLOUDFLARE_R2_ACCESS_KEY_ID'),
		requireSetting(appSettingKeys.r2SecretAccessKey, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
		requireSetting(appSettingKeys.r2BucketName, 'CLOUDFLARE_R2_BUCKET'),
		requireSetting(appSettingKeys.r2Endpoint, 'CLOUDFLARE_R2_ENDPOINT'),
		requireSetting(appSettingKeys.r2PublicBaseUrl, 'CLOUDFLARE_R2_PUBLIC_BASE_URL'),
		(async () => (await getAppSetting(appSettingKeys.r2ApiToken))?.trim() ?? null)(),
	]);

    let formattedBaseUrl = publicBaseUrl.replace(/\/$/, '');
    if (!formattedBaseUrl.startsWith('http://') && !formattedBaseUrl.startsWith('https://')) {
        formattedBaseUrl = `https://${formattedBaseUrl}`;
    }

	return {
		accountId,
		accessKeyId,
		secretAccessKey,
		bucketName,
		endpoint,
		publicBaseUrl: formattedBaseUrl,
		apiToken,
	};
}

export async function tryGetR2Config(): Promise<R2Config | null> {
	try {
		return await getR2Config();
	} catch {
		return null;
	}
}
