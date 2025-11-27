'use server';

import { revalidatePath } from 'next/cache';

import { HeadBucketCommand } from '@aws-sdk/client-s3';

import { requireUser } from '@/lib/auth/session';
import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';
import { createR2Client } from '@/lib/r2/client';
import { getR2Config } from '@/lib/r2/config';
import { setMontageChecklistTemplates, type MontageChecklistTemplate } from '@/lib/montaze/checklist';
import { getAuthUrl, getCalendarClient } from '@/lib/google/calendar';
import { db } from '@/lib/db';
import { googleCalendarSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getGoogleAuthUrlAction() {
  await requireUser();
  return getAuthUrl();
}

export async function disconnectGoogleCalendar() {
  const user = await requireUser();
  await db.delete(googleCalendarSettings).where(eq(googleCalendarSettings.userId, user.id));
  revalidatePath('/dashboard/settings');
}

export async function getGoogleCalendarStatus() {
  const user = await requireUser();
  const settings = await db.query.googleCalendarSettings.findFirst({
    where: eq(googleCalendarSettings.userId, user.id),
  });

  return {
    isConnected: !!settings,
    targetCalendarId: settings?.targetCalendarId,
  };
}

export async function listGoogleCalendars() {
  const user = await requireUser();
  const calendar = await getCalendarClient(user.id);
  if (!calendar) return [];

  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

export async function setTargetCalendar(calendarId: string) {
  const user = await requireUser();
  await db
    .update(googleCalendarSettings)
    .set({ targetCalendarId: calendarId })
    .where(eq(googleCalendarSettings.userId, user.id));
  revalidatePath('/dashboard/settings');
}

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

export async function testWooWebhookSecret() {
	const user = await requireUser();
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze wykonywac test polaczenia.');
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
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
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
	if (user.role !== 'owner') {
		throw new Error('Tylko wlasciciel moze wykonywac test polaczenia.');
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
	if (user.role !== 'owner') {
		throw new Error('Tylko właściciel może zmieniać szablony etapów.');
	}

	await setMontageChecklistTemplates({ templates, userId: user.id });
	revalidatePath('/dashboard/settings');
}

