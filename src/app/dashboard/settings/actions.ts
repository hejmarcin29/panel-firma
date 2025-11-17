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

