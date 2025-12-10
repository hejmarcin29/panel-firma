'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { createR2Client } from '@/lib/r2/client';
import { getR2Config } from '@/lib/r2/config';
import { setMontageChecklistTemplates, type MontageChecklistTemplate } from '@/lib/montaze/checklist';
import { setMontageAutomationRules, type MontageAutomationRule } from '@/lib/montaze/automation';
import { setMontageStatusDefinitions, type MontageStatusDefinition } from '@/lib/montaze/statuses';
import { logSystemEvent } from '@/lib/logging';

export async function updateWooWebhookSecret(secret: string) {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator moze zmieniac konfiguracje integracji.');
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

	await logSystemEvent('update_webhook_secret', 'Zaktualizowano sekret webhooka WooCommerce', user.id);

	process.env.WOOCOMMERCE_WEBHOOK_SECRET = trimmed;
	revalidatePath('/dashboard/settings');
}

export async function testWooWebhookSecret() {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator moze wykonywac test polaczenia.');
	}

	const secret = await getAppSetting(appSettingKeys.wooWebhookSecret);
	if (!secret?.trim()) {
		throw new Error('Sekret webhooka nie jest ustawiony. Zapisz go przed testem.');
	}

	return 'Sekret webhooka jest zapisany. Wyslij testowe zamowienie z WooCommerce, aby zweryfikowac webhook.';
}

type UpdateR2ConfigInput = {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	endpoint: string;
	publicBaseUrl: string;
	apiToken: string;
};

export async function updateR2Config({ accountId, accessKeyId, secretAccessKey, bucketName, endpoint, publicBaseUrl, apiToken }: UpdateR2ConfigInput) {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator moze zmieniac konfiguracje integracji.');
	}

	const trimmedAccountId = accountId.trim();
	const trimmedAccessKeyId = accessKeyId.trim();
	const trimmedSecretAccessKey = secretAccessKey.trim();
	const trimmedBucketName = bucketName.trim();
	const trimmedEndpoint = endpoint.trim();
	const trimmedPublicBaseUrl = publicBaseUrl.trim();
	const trimmedApiToken = apiToken.trim();

	if (!trimmedAccountId || !trimmedAccessKeyId || !trimmedSecretAccessKey || !trimmedBucketName || !trimmedEndpoint || !trimmedPublicBaseUrl) {
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

	let sanitizedPublicBaseUrl = trimmedPublicBaseUrl.replace(/\/$/, '');
	try {
		const parsedPublicBaseUrl = new URL(trimmedPublicBaseUrl);
		if (parsedPublicBaseUrl.protocol !== 'https:') {
			throw new Error('Publiczny adres R2.dev powinien korzystac z protokolu HTTPS.');
		}
		sanitizedPublicBaseUrl = parsedPublicBaseUrl.toString().replace(/\/$/, '');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Niepoprawny publiczny adres R2.dev.';
		throw new Error(message);
	}

	await Promise.all([
		setAppSetting({ key: appSettingKeys.r2AccountId, value: trimmedAccountId, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2AccessKeyId, value: trimmedAccessKeyId, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2SecretAccessKey, value: trimmedSecretAccessKey, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2BucketName, value: trimmedBucketName, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2Endpoint, value: trimmedEndpoint, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2PublicBaseUrl, value: sanitizedPublicBaseUrl, userId: user.id }),
		setAppSetting({ key: appSettingKeys.r2ApiToken, value: trimmedApiToken, userId: user.id }),
	]);

	await logSystemEvent('update_r2_config', 'Zaktualizowano konfigurację R2', user.id);

	process.env.CLOUDFLARE_R2_ACCOUNT_ID = trimmedAccountId;
	process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = trimmedAccessKeyId;
	process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = trimmedSecretAccessKey;
	process.env.CLOUDFLARE_R2_BUCKET = trimmedBucketName;
	process.env.CLOUDFLARE_R2_ENDPOINT = trimmedEndpoint;
	process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL = sanitizedPublicBaseUrl;
	process.env.CLOUDFLARE_R2_API_TOKEN = trimmedApiToken;

	revalidatePath('/dashboard/settings');
}

export async function testR2Connection() {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator moze wykonywac test polaczenia.');
	}

	const config = await getR2Config();
	const client = createR2Client(config);

	try {
		await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
		return `Polaczenie dziala. Bucket ${config.bucketName} jest osiagalny.`;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nie udalo sie polaczyc z bucketem.';
		throw new Error(message);
	}
}

export async function updateMontageChecklistTemplatesAction(templates: MontageChecklistTemplate[]) {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator może zmieniać szablony etapów.');
	}

	await setMontageChecklistTemplates({ templates, userId: user.id });
	
	await logSystemEvent('update_montage_templates', 'Zaktualizowano szablony etapów montażu', user.id);

	revalidatePath('/dashboard/settings');
}

export async function updateMontageAutomationRulesAction(rules: MontageAutomationRule[]) {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator może zmieniać reguły automatyzacji.');
	}

	await setMontageAutomationRules(rules, user.id);
	
	await logSystemEvent('update_montage_automation', 'Zaktualizowano reguły automatyzacji montażu', user.id);

	revalidatePath('/dashboard/settings');
}

export async function updateMontageStatusDefinitionsAction(statuses: MontageStatusDefinition[]) {
	const user = await requireUser();
	if (!user.roles.includes('admin')) {
		throw new Error('Tylko administrator może zmieniać definicje statusów.');
	}

	await setMontageStatusDefinitions(statuses, user.id);
	
	await logSystemEvent('update_montage_statuses', 'Zaktualizowano definicje statusów montażu', user.id);

	revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/montaze');
}

export type MobileMenuItem = {
    id: string;
    label: string;
    href: string;
    iconName: string;
    visible: boolean;
};

export async function updateMobileMenuConfig(config: MobileMenuItem[]) {
    const user = await requireUser();
    
    await db.update(users)
        .set({ mobileMenuConfig: config, updatedAt: new Date() })
        .where(eq(users.id, user.id));
        
    revalidatePath('/dashboard');
}

export async function updateKpiSettings(
    montageThreatDays: number, 
    orderUrgentDays: number,
    alertMissingMaterialStatusDays: number,
    alertMissingInstallerStatusDays: number,
    alertMissingMeasurerDays: number,
    alertMissingInstallerDays: number,
    alertMaterialOrderedDays: number,
    alertMaterialInstockDays: number,
    // New params
    alertLeadNoMeasurerDays: number,
    alertQuoteDelayDays: number,
    alertOfferStalledDays: number
) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Tylko administrator może zmieniać ustawienia KPI.');
    }

    await setAppSetting({
        key: appSettingKeys.kpiMontageThreatDays,
        value: String(montageThreatDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiOrderUrgentDays,
        value: String(orderUrgentDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMissingMaterialStatusDays,
        value: String(alertMissingMaterialStatusDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMissingInstallerStatusDays,
        value: String(alertMissingInstallerStatusDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMissingMeasurerDays,
        value: String(alertMissingMeasurerDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMissingInstallerDays,
        value: String(alertMissingInstallerDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMaterialOrderedDays,
        value: String(alertMaterialOrderedDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertMaterialInstockDays,
        value: String(alertMaterialInstockDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertLeadNoMeasurerDays,
        value: String(alertLeadNoMeasurerDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertQuoteDelayDays,
        value: String(alertQuoteDelayDays),
        userId: user.id,
    });

    await setAppSetting({
        key: appSettingKeys.kpiAlertOfferStalledDays,
        value: String(alertOfferStalledDays),
        userId: user.id,
    });

    await logSystemEvent('update_kpi_settings', `Zaktualizowano ustawienia KPI`, user.id);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/montaze');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');
}

export async function uploadLogo(formData: FormData) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Tylko administrator może zmieniać logo.');
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('Nie wybrano pliku.');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('Nieprawidłowy format pliku.');
    }

    if (file.size > 2 * 1024 * 1024) {
        throw new Error('Plik jest za duży (max 2MB).');
    }

    const r2Config = await getR2Config();
    const client = createR2Client(r2Config);

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `system/logo-${Date.now()}.${file.name.split('.').pop()}`;

    await client.send(new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
    }));

    const url = `${r2Config.publicBaseUrl}/${key}`;

    await setAppSetting({
        key: appSettingKeys.systemLogoUrl,
        value: url,
        userId: user.id,
    });

    await logSystemEvent('update_logo', 'Zaktualizowano logo systemu', user.id);
    revalidatePath('/', 'layout');
    return url;
}

export async function removeLogo() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Tylko administrator może usuwać logo.');
    }

    await setAppSetting({
        key: appSettingKeys.systemLogoUrl,
        value: '',
        userId: user.id,
    });

    await logSystemEvent('remove_logo', 'Usunięto logo systemu', user.id);
    revalidatePath('/', 'layout');
}


