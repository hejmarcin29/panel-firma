'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { appSettingKeys } from '@/lib/settings';

export async function saveWooSettings(formData: FormData) {
	const user = await requireUser();

	const consumerKey = formData.get('consumerKey') as string;
	const consumerSecret = formData.get('consumerSecret') as string;
	const webhookSecret = formData.get('webhookSecret') as string;
	const wooUrl = formData.get('wooUrl') as string;

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

	revalidatePath('/dashboard/integrations');
}
