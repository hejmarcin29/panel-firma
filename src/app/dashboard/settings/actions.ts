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
	login: string;
	apiKey: string;
	tenant: string;
};

export async function updateWfirmaConfig({ login, apiKey, tenant }: UpdateWfirmaConfigInput) {
	const user = await requireUser();
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
	}

	const trimmedLogin = login.trim();
	const trimmedKey = apiKey.trim();
	const trimmedTenant = tenant.trim();

	if (!trimmedLogin || !trimmedKey || !trimmedTenant) {
		throw new Error('Wszystkie pola musza byc wypelnione.');
	}

	if (trimmedKey.length < 16) {
		throw new Error('Klucz API powinien miec co najmniej 16 znakow.');
	}

	await Promise.all([
		setAppSetting({ key: appSettingKeys.wfirmaLogin, value: trimmedLogin, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaApiKey, value: trimmedKey, userId: user.id }),
		setAppSetting({ key: appSettingKeys.wfirmaTenant, value: trimmedTenant, userId: user.id }),
	]);

	process.env.WFIRMA_LOGIN = trimmedLogin;
	process.env.WFIRMA_API_KEY = trimmedKey;
	process.env.WFIRMA_TENANT = trimmedTenant;

	revalidatePath('/dashboard/settings');
}

