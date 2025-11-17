import 'server-only';

import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { appSettings } from './db/schema';

export const appSettingKeys = {
	wooWebhookSecret: 'woocommerce.webhook_secret',
	wfirmaTenant: 'wfirma.tenant',
	wfirmaAppKey: 'wfirma.app_key',
	wfirmaAppSecret: 'wfirma.app_secret',
	wfirmaAccessKey: 'wfirma.access_key',
	wfirmaAccessSecret: 'wfirma.access_secret',
	r2AccountId: 'r2.account_id',
	r2AccessKeyId: 'r2.access_key_id',
	r2SecretAccessKey: 'r2.secret_access_key',
	r2BucketName: 'r2.bucket_name',
	r2Endpoint: 'r2.endpoint',
	r2ApiToken: 'r2.api_token',
	r2PublicBaseUrl: 'r2.public_base_url',
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
		case appSettingKeys.wfirmaTenant:
			return process.env.WFIRMA_TENANT?.trim() || null;
		case appSettingKeys.wfirmaAppKey:
			return process.env.WFIRMA_APP_KEY?.trim() || null;
		case appSettingKeys.wfirmaAppSecret:
			return process.env.WFIRMA_APP_SECRET?.trim() || null;
		case appSettingKeys.wfirmaAccessKey:
			return process.env.WFIRMA_ACCESS_KEY?.trim() || null;
		case appSettingKeys.wfirmaAccessSecret:
			return process.env.WFIRMA_ACCESS_SECRET?.trim() || null;
		case appSettingKeys.r2AccountId:
			return process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() || null;
		case appSettingKeys.r2AccessKeyId:
			return process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || null;
		case appSettingKeys.r2SecretAccessKey:
			return process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || null;
		case appSettingKeys.r2BucketName:
			return process.env.CLOUDFLARE_R2_BUCKET?.trim() || null;
		case appSettingKeys.r2Endpoint:
			return process.env.CLOUDFLARE_R2_ENDPOINT?.trim() || null;
		case appSettingKeys.r2ApiToken:
			return process.env.CLOUDFLARE_R2_API_TOKEN?.trim() || null;
		case appSettingKeys.r2PublicBaseUrl:
			return process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim() || null;
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
