'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { appSettingKeys, getAppSetting } from '@/lib/settings';

export async function saveWooSettings(formData: FormData) {
	const user = await requireUser();

	const consumerKey = formData.get('consumerKey') as string;
	const consumerSecret = formData.get('consumerSecret') as string;
	const webhookSecret = formData.get('webhookSecret') as string;
	let wooUrl = formData.get('wooUrl') as string;

    if (wooUrl && !wooUrl.startsWith('http://') && !wooUrl.startsWith('https://')) {
        wooUrl = `https://${wooUrl}`;
    }

	const settingsToUpdate = [
		{ key: appSettingKeys.wooConsumerKey, value: consumerKey },
		{ key: appSettingKeys.wooConsumerSecret, value: consumerSecret },
		{ key: appSettingKeys.wooWebhookSecret, value: webhookSecret },
		{ key: appSettingKeys.wooUrl, value: wooUrl },
	];

	for (const setting of settingsToUpdate) {
		await db
			.insert(appSettings)
			.values({
				key: setting.key,
				value: setting.value || '',
				updatedBy: user.id,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: appSettings.key,
				set: {
					value: setting.value || '',
					updatedBy: user.id,
					updatedAt: new Date(),
				},
			});
	}

	revalidatePath('/dashboard/settings');
}

export async function testWooConnection() {
	await requireUser();

	const url = await getAppSetting(appSettingKeys.wooUrl);
	const key = await getAppSetting(appSettingKeys.wooConsumerKey);
	const secret = await getAppSetting(appSettingKeys.wooConsumerSecret);

	if (!url || !key || !secret) {
		return { success: false, message: 'Brak konfiguracji WooCommerce.' };
	}

	try {
		// Remove trailing slash if present
		let baseUrl = url.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
        }

		const auth = Buffer.from(`${key}:${secret}`).toString('base64');
		
		const response = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
			headers: {
				Authorization: `Basic ${auth}`,
			},
            next: { revalidate: 0 } 
		});

		if (!response.ok) {
            if (response.status === 401) {
                return { success: false, message: 'Błąd autoryzacji. Sprawdź klucze API.' };
            }
			return { success: false, message: `Błąd połączenia: ${response.status} ${response.statusText}` };
		}

		const data = await response.json();
		return { success: true, message: 'Połączenie nawiązane pomyślnie.', data: { version: data.environment?.version } };
	} catch (error) {
		console.error('WooCommerce connection test error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
		return { success: false, message: `Wystąpił błąd: ${errorMessage}` };
	}
}
export async function saveInPostSettings(formData: FormData) {
	const user = await requireUser();

	const orgId = formData.get('orgId') as string;
	const token = formData.get('token') as string;
	const geowidgetToken = formData.get('geowidgetToken') as string;
	const sandbox = formData.get('sandbox') === 'true';

	const settingsToUpdate = [
		{ key: appSettingKeys.inpostOrgId, value: orgId },
		{ key: appSettingKeys.inpostToken, value: token },
		{ key: appSettingKeys.inpostGeowidgetToken, value: geowidgetToken },
		{ key: appSettingKeys.inpostSandbox, value: sandbox ? 'true' : 'false' },
	];

	for (const setting of settingsToUpdate) {
		await db
			.insert(appSettings)
			.values({
				key: setting.key,
				value: setting.value || '',
				updatedBy: user.id,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: appSettings.key,
				set: {
					value: setting.value || '',
					updatedBy: user.id,
					updatedAt: new Date(),
				},
			});
	}

	revalidatePath('/dashboard/settings');
}