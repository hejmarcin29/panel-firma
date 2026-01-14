
import { eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { appSettings } from './db/schema';

export const appSettingKeys = {
	wooWebhookSecret: 'woocommerce.webhook_secret',
	wooConsumerKey: 'woocommerce.consumer_key',
	wooConsumerSecret: 'woocommerce.consumer_secret',
	wooUrl: 'woocommerce.url',
	r2AccountId: 'r2.account_id',
	r2AccessKeyId: 'r2.access_key_id',
	r2SecretAccessKey: 'r2.secret_access_key',
	r2BucketName: 'r2.bucket_name',
	r2Endpoint: 'r2.endpoint',
	r2ApiToken: 'r2.api_token',
	r2PublicBaseUrl: 'r2.public_base_url',
    tpayClientId: 'tpay.client_id',
    tpayClientSecret: 'tpay.client_secret',
    tpayIsSandbox: 'tpay.is_sandbox',
	montageChecklist: 'montage.checklist',
	montageAutomation: 'montage.automation', // Legacy: Array of rules
    montageAutomationSettings: 'montage.automation_settings', // New: Record<string, boolean>
	montageNotifications: 'montage.notifications',
	montageStatuses: 'montage.statuses',
	kpiMontageThreatDays: 'kpi.montage_threat_days',
	kpiOrderUrgentDays: 'kpi.order_urgent_days',
    kpiAlertMissingMaterialStatusDays: 'kpi.alert_missing_material_status_days',
    kpiAlertMissingInstallerStatusDays: 'kpi.alert_missing_installer_status_days',
    kpiAlertMissingMeasurerDays: 'kpi.alert_missing_measurer_days',
    kpiAlertMissingInstallerDays: 'kpi.alert_missing_installer_days',
    kpiAlertMaterialOrderedDays: 'kpi.alert_material_ordered_days',
    kpiAlertMaterialInstockDays: 'kpi.alert_material_instock_days',
    // Measurement & Sales KPI
    kpiAlertLeadNoMeasurerDays: 'kpi.alert_lead_no_measurer_days',
    kpiAlertQuoteDelayDays: 'kpi.alert_quote_delay_days',
    kpiAlertOfferStalledDays: 'kpi.alert_offer_stalled_days',
	googleCalendarId: 'google.calendar_id',
	googleClientEmail: 'google.client_email',
	googlePrivateKey: 'google.private_key',
    googleOAuthClientId: 'google.oauth_client_id',
    googleOAuthClientSecret: 'google.oauth_client_secret',
    systemLogoUrl: 'system.logo_url',
    companyName: 'company.name',
    companyAddress: 'company.address',
    companyNip: 'company.nip',
    companyBankName: 'company.bank_name',
    companyBankAccount: 'company.bank_account',
    // Portal & SMS
    portalEnabled: 'portal.enabled',
    smsProvider: 'sms.provider',

    // Sample Shop / Logistics
    sampleOrderNotificationEmail: 'samples.notification_email',
    sampleOrderConfirmationSubject: 'samples.confirmation_subject',
    sampleOrderConfirmationTemplate: 'samples.confirmation_template',
    requireInstallerForMeasurement: 'montage.require_installer_for_measurement',
    smsToken: 'sms.token',
    smsSenderName: 'sms.sender_name',
    companyLogoUrl: 'company.logo_url',
    cloudflareTurnstileSiteKey: 'cloudflare.turnstile_site_key',
    cloudflareTurnstileSecretKey: 'cloudflare.turnstile_secret_key',
    // InPost
    inpostOrgId: 'inpost.org_id',
    inpostToken: 'inpost.token',
    inpostGeowidgetToken: 'inpost.geowidget_token',
	inpostGeowidgetConfig: 'inpost.geowidget_config',
    inpostSandbox: 'inpost.sandbox',
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
		case appSettingKeys.googleCalendarId:
			return process.env.GOOGLE_CALENDAR_ID?.trim() || null;
		case appSettingKeys.googleClientEmail:
			return process.env.GOOGLE_CLIENT_EMAIL?.trim() || null;
		case appSettingKeys.googlePrivateKey:
			return process.env.GOOGLE_PRIVATE_KEY?.trim() || null;
        case appSettingKeys.cloudflareTurnstileSiteKey:
            return process.env.CLOUDFLARE_TURNSTILE_SITE_KEY?.trim() || null;
        case appSettingKeys.cloudflareTurnstileSecretKey:
            return process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() || null;
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
