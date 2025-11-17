'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';
import { appSettingKeys, setAppSetting } from '@/lib/settings';

export async function updateWooWebhookSecret(secret: string) {
	const user = await requireUser();
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
	}

	const trimmed = secret.trim();
	if (!trimmed) {
		throw new Error('Sekret nie moze byc pusty.');
	}

	if (trimmed.length < 16) {
		throw new Error('Sekret powinien miec co najmniej 16 znakow.');
	}

	await setAppSetting({
		key: appSettingKeys.wooWebhookSecret,
		value: trimmed,
		userId: user.id,
	});

	process.env.WOOCOMMERCE_WEBHOOK_SECRET = trimmed;
	revalidatePath('/dashboard/settings');
}

type UpdateWfirmaConfigInput = {
	tenant: string;
	appKey: string;
	appSecret: string;
	accessKey: string;
	accessSecret: string;
};

export async function updateWfirmaConfig({ tenant, appKey, appSecret, accessKey, accessSecret }: UpdateWfirmaConfigInput) {
	const user = await requireUser();
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
	}

	const trimmedTenant = tenant.trim();
	const trimmedAppKey = appKey.trim();
	const trimmedAppSecret = appSecret.trim();
	const trimmedAccessKey = accessKey.trim();
	const trimmedAccessSecret = accessSecret.trim();

	if (!trimmedTenant || !trimmedAppKey || !trimmedAppSecret || !trimmedAccessKey || !trimmedAccessSecret) {
		throw new Error('Uzupelnij wszystkie pola konfiguracji wFirma.');
	}

	if (trimmedAppSecret.length < 16 || trimmedAccessSecret.length < 16) {
		throw new Error('Sekret aplikacji i sekret dostepowy powinny miec co najmniej 16 znakow.');
	}

	await Promise.all([
		setAppSetting({ key: appSettingKeys.wfirmaTenant, value: trimmedTenant, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaAppKey, value: trimmedAppKey, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaAppSecret, value: trimmedAppSecret, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaAccessKey, value: trimmedAccessKey, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaAccessSecret, value: trimmedAccessSecret, userId: user.id }),
	]);

	process.env.WFIRMA_TENANT = trimmedTenant;
	process.env.WFIRMA_APP_KEY = trimmedAppKey;
	process.env.WFIRMA_APP_SECRET = trimmedAppSecret;
	process.env.WFIRMA_ACCESS_KEY = trimmedAccessKey;
	process.env.WFIRMA_ACCESS_SECRET = trimmedAccessSecret;

	revalidatePath('/dashboard/settings');
}

type UpdateR2ConfigInput = {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	endpoint: string;
	apiToken: string;
};

export async function updateR2Config({ accountId, accessKeyId, secretAccessKey, bucketName, endpoint, apiToken }: UpdateR2ConfigInput) {
	const user = await requireUser();
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
	}

	const trimmedAccountId = accountId.trim();
	const trimmedAccessKeyId = accessKeyId.trim();
	const trimmedSecretAccessKey = secretAccessKey.trim();
	const trimmedBucketName = bucketName.trim();
	const trimmedEndpoint = endpoint.trim();
	const trimmedApiToken = apiToken.trim();

	if (!trimmedAccountId || !trimmedAccessKeyId || !trimmedSecretAccessKey || !trimmedBucketName || !trimmedEndpoint) {
		throw new Error('Uzupelnij wszystkie wymagane pola konfiguracji R2.');
	}

	if (trimmedSecretAccessKey.length < 16) {
		throw new Error('Sekretny klucz dostepowy powinien miec co najmniej 16 znakow.');
	}

	try {
		const parsedEndpoint = new URL(trimmedEndpoint);
		if (parsedEndpoint.protocol !== 'https:') {
			throw new Error('Endpoint powinien korzystac z protokolu HTTPS.');
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Niepoprawny adres endpointu R2.';
		throw new Error(message);
	}

	await Promise.all([
		setAppSetting({ key: appSettingKeys.r2AccountId, value: trimmedAccountId, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2AccessKeyId, value: trimmedAccessKeyId, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2SecretAccessKey, value: trimmedSecretAccessKey, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2BucketName, value: trimmedBucketName, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2Endpoint, value: trimmedEndpoint, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2ApiToken, value: trimmedApiToken, userId: user.id }),
	]);

	process.env.CLOUDFLARE_R2_ACCOUNT_ID = trimmedAccountId;
	process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = trimmedAccessKeyId;
	process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = trimmedSecretAccessKey;
	process.env.CLOUDFLARE_R2_BUCKET = trimmedBucketName;
	process.env.CLOUDFLARE_R2_ENDPOINT = trimmedEndpoint;
	process.env.CLOUDFLARE_R2_API_TOKEN = trimmedApiToken;

	revalidatePath('/dashboard/settings');
}

