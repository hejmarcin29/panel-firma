import 'server-only';

import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { appSettings } from './db/schema';

export const appSettingKeys = {
	wooWebhookSecret: 'woocommerce.webhook_secret',
	wfirmaLogin: 'wfirma.login',
	wfirmaApiKey: 'wfirma.api_key',
	wfirmaTenant: 'wfirma.tenant',
} as const;

export type AppSettingKey = (typeof appSettingKeys)[keyof typeof appSettingKeys];

type SettingRecord = {
	key: AppSettingKey;
	value: string;
};

type SetAppSettingParams = {
	key: AppSettingKey;
	value: string;
	userId: string;
};

function readEnvFallback(key: AppSettingKey): string | null {
	switch (key) {
		case appSettingKeys.wooWebhookSecret:
			return process.env.WOOCOMMERCE_WEBHOOK_SECRET?.trim() || null;
		case appSettingKeys.wfirmaLogin:
			return process.env.WFIRMA_LOGIN?.trim() || null;
		case appSettingKeys.wfirmaApiKey:
			return process.env.WFIRMA_API_KEY?.trim() || null;
		case appSettingKeys.wfirmaTenant:
			return process.env.WFIRMA_TENANT?.trim() || null;
		default:
			return null;
	}
}

export async function getAppSetting(key: AppSettingKey): Promise<string | null> {
	const rows = await db
		.select({ key: appSettings.key, value: appSettings.value })
		.from(appSettings)
		.where(eq(appSettings.key, key));

	const record = rows[0] as SettingRecord | undefined;
	const stored = record?.value?.trim() ?? null;
	return stored && stored.length > 0 ? stored : readEnvFallback(key);
}

export async function getAppSettings(keys: readonly AppSettingKey[]): Promise<Partial<Record<AppSettingKey, string | null>>> {
	const defaults = keys.reduce<Partial<Record<AppSettingKey, string | null>>>((acc, current) => {
		acc[current] = readEnvFallback(current);
		return acc;
	}, {} as Partial<Record<AppSettingKey, string | null>>);

	if (keys.length === 0) {
		return defaults;
	}

	const rows = await db
		.select({ key: appSettings.key, value: appSettings.value })
		.from(appSettings)
		.where(inArray(appSettings.key, keys as AppSettingKey[]));

	for (const row of rows as SettingRecord[]) {
		const normalized = row.value?.trim() ?? null;
		defaults[row.key] = normalized && normalized.length > 0 ? normalized : readEnvFallback(row.key);
	}

	return defaults;
}

export async function setAppSetting({ key, value, userId }: SetAppSettingParams): Promise<void> {
	const now = new Date();
	const sanitized = value.trim();

	await db
		.insert(appSettings)
		.values({
			key,
			value: sanitized,
			updatedAt: now,
			updatedBy: userId,
		})
		.onConflictDoUpdate({
			target: appSettings.key,
			set: {
				value: sanitized,
				updatedAt: now,
				updatedBy: userId,
			},
		});
}
