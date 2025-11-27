import { headers } from 'next/headers';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/db';
import { integrationLogs, mailAccounts, manualOrders } from '@/lib/db/schema';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';

import { WebhookSecretForm } from './_components/webhook-secret-form';
import { R2ConfigForm } from './_components/r2-config-form';
import { MailSettingsForm } from './_components/mail-settings-form';
import { MontageChecklistSettings } from './_components/montage-checklist-settings';
import { SettingsView } from './_components/settings-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { GoogleCalendarSettings } from './_components/google-calendar-settings';

type LogLevel = 'info' | 'warning' | 'error';

type LogRow = {
	id: string;
	createdAt: number | null;
	level: LogLevel;
	message: string;
};

function formatTimestamp(value: number | Date | null | undefined) {
	if (!value) {
		return 'brak';
	}

	const timestamp = value instanceof Date ? value.getTime() : value;

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'short',
		timeStyle: 'medium',
	}).format(new Date(timestamp));
}

function levelBadgeClass(level: LogLevel) {
	switch (level) {
		case 'info':
			return 'bg-emerald-100 text-emerald-900 border-transparent';
		case 'warning':
			return 'bg-amber-100 text-amber-900 border-transparent';
		case 'error':
		default:
			return 'border-transparent bg-destructive text-white';
	}
}

export default async function SettingsPage() {
	const headerList = await headers();
	const forwardedProto = headerList.get('x-forwarded-proto');
	const forwardedHost = headerList.get('x-forwarded-host');
	const hostHeader = headerList.get('host');

	const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? null;
	const host = forwardedHost ?? hostHeader ?? configuredBaseUrl?.replace(/https?:\/\//, '') ?? 'localhost:3000';
	const protocol =
		forwardedProto ?? configuredBaseUrl?.split('://')[0] ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');

	const webhookBase = configuredBaseUrl ?? `${protocol}://${host}`;
	const webhookUrl = `${webhookBase.replace(/\/$/, '')}/api/woocommerce/webhook`;

	const [
		webhookSecretSetting,
		r2AccountIdSetting,
		r2AccessKeyIdSetting,
		r2SecretAccessKeySetting,
		r2BucketNameSetting,
		r2EndpointSetting,
		r2PublicBaseUrlSetting,
		r2ApiTokenSetting,
		montageChecklistTemplates,
	] = await Promise.all([
		getAppSetting(appSettingKeys.wooWebhookSecret),
		getAppSetting(appSettingKeys.r2AccountId),
		getAppSetting(appSettingKeys.r2AccessKeyId),
		getAppSetting(appSettingKeys.r2SecretAccessKey),
		getAppSetting(appSettingKeys.r2BucketName),
		getAppSetting(appSettingKeys.r2Endpoint),
		getAppSetting(appSettingKeys.r2PublicBaseUrl),
		getAppSetting(appSettingKeys.r2ApiToken),
		getMontageChecklistTemplates(),
	]);

	const webhookSecret = webhookSecretSetting ?? '';
	const secretConfigured = Boolean(webhookSecret);

	const [pendingRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(manualOrders)
		.where(eq(manualOrders.requiresReview, true));

	const pendingReviewCount = Number(pendingRow?.count ?? 0);

	const rawLogs = await db
		.select({
			id: integrationLogs.id,
			createdAt: integrationLogs.createdAt,
			level: integrationLogs.level,
			message: integrationLogs.message,
		})
		.from(integrationLogs)
		.where(eq(integrationLogs.integration, 'woocommerce'))
		.orderBy(desc(integrationLogs.createdAt))
		.limit(20);

	const logs: LogRow[] = rawLogs.map((log) => ({
		id: log.id ?? crypto.randomUUID(),
		createdAt:
			log.createdAt instanceof Date
				? log.createdAt.getTime()
				: typeof log.createdAt === 'number'
					? log.createdAt
					: null,
		level: (log.level ?? 'info') as LogLevel,
		message: log.message ?? '',
	}));

	const lastEvent = logs[0] ?? null;

	const r2Configured = Boolean(
		r2AccountIdSetting &&
		r2AccessKeyIdSetting &&
		r2SecretAccessKeySetting &&
		r2BucketNameSetting &&
		r2EndpointSetting &&
		r2PublicBaseUrlSetting,
	);
	const r2StatusBadgeClass = r2Configured
		? 'bg-emerald-100 text-emerald-900 border-transparent'
		: 'border border-dashed text-muted-foreground';
	const r2StatusLabel = r2Configured ? 'Skonfigurowano' : 'Brak konfiguracji';

	const mailRows = await db
		.select()
		.from(mailAccounts)
		.orderBy(mailAccounts.displayName);

	const formattedMailAccounts = mailRows.map((account) => ({
		id: account.id,
		displayName: account.displayName,
		email: account.email,
		provider: account.provider,
		status: account.status,
		imapHost: account.imapHost,
		imapPort: account.imapPort,
		imapSecure: account.imapSecure,
		smtpHost: account.smtpHost,
		smtpPort: account.smtpPort,
		smtpSecure: account.smtpSecure,
		username: account.username,
		signature: account.signature,
		hasPassword: Boolean(account.passwordSecret),
		lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
		nextSyncAt: account.nextSyncAt?.toISOString() ?? null,
	}));

	return (
		<SettingsView
			mailSettings={<MailSettingsForm accounts={formattedMailAccounts} />}
			montageSettings={<MontageChecklistSettings initialTemplates={montageChecklistTemplates} />}
			logs={
				<Card>
					<CardHeader>
						<CardTitle>Logi integracji</CardTitle>
						<CardDescription>Ostatnie wpisy zapisywane podczas przetwarzania webhooka.</CardDescription>
					</CardHeader>
					<CardContent>
						{logs.length === 0 ? (
							<p className="text-sm text-muted-foreground">Brak logow dla integracji WooCommerce.</p>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Data</TableHead>
											<TableHead>Poziom</TableHead>
											<TableHead>Opis</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{logs.map((log) => (
											<TableRow key={log.id}>
												<TableCell>{formatTimestamp(log.createdAt)}</TableCell>
												<TableCell>
													<Badge className={levelBadgeClass(log.level)}>{log.level}</Badge>
												</TableCell>
												<TableCell className="max-w-md whitespace-normal text-xs">
													{log.message}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			}
			integrations={
				<div className="space-y-6">
					<GoogleCalendarSettings />
					{!secretConfigured && (
						<Alert variant="destructive">
							<AlertTitle>Brakuje sekretu webhooka</AlertTitle>
							<AlertDescription>
								Ustaw sekret w formularzu ponizej, aby aktywowac weryfikacje webhookow WooCommerce.
							</AlertDescription>
						</Alert>
					)}
					<Card>
						<CardHeader>
							<CardTitle>Webhook WooCommerce</CardTitle>
							<CardDescription>Ustaw dane ponizej w panelu WordPress, aby zamowienia trafialy do systemu.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<WebhookSecretForm initialSecret={webhookSecret} />
							<dl className="grid gap-3 text-sm">
								<div>
									<dt className="text-muted-foreground">Adres URL dostawy</dt>
									<dd className="font-mono text-xs break-all rounded bg-muted px-3 py-2">{webhookUrl}</dd>
								</div>
							</dl>
							<ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
								<li>Temat webhooka: <code>order.created</code></li>
								<li>Wersja API: <code>WP REST API v3</code></li>
								<li>Sekret przechowywany jest w bazie danych i mozesz go zaktualizowac w tym panelu.</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			}
			storage={
				<Card>
					<CardHeader>
						<CardTitle>Cloudflare R2</CardTitle>
						<CardDescription>Skonfiguruj magazyn do przechowywania zalacznikow klientow.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<Badge className={r2StatusBadgeClass}>{r2StatusLabel}</Badge>
							{r2BucketNameSetting ? <span className="text-muted-foreground">Bucket {r2BucketNameSetting}</span> : null}
						</div>
						<R2ConfigForm
							initialAccountId={r2AccountIdSetting ?? ''}
							initialAccessKeyId={r2AccessKeyIdSetting ?? ''}
							initialSecretAccessKey={r2SecretAccessKeySetting ?? ''}
							initialBucketName={r2BucketNameSetting ?? ''}
							initialEndpoint={r2EndpointSetting ?? ''}
							initialPublicBaseUrl={r2PublicBaseUrlSetting ?? ''}
							initialApiToken={r2ApiTokenSetting ?? ''}
						/>
						<div className="space-y-2 text-xs text-muted-foreground">
							<p>
								Trzymaj wartosci w bazie albo ustaw je w <code>.env.local</code> (zmienne <code>CLOUDFLARE_R2_*</code>).
								Pole tokenu API jest opcjonalne i potrzebne tylko przy wywolaniach HTTP do Cloudflare.
							</p>
							<ul className="list-disc space-y-1 pl-5">
								<li><code>Account ID</code> znajduje sie w Cloudflare R2.</li>
								<li><code>Access Key ID</code> i <code>Secret Access Key</code> autoryzuja klienta S3.</li>
								<li><code>Endpoint</code> powinien wskazywac region, np. <code>https://...r2.cloudflarestorage.com</code>.</li>
								<li><code>Publiczny URL</code> to adres <code>*.r2.dev</code>, ktory pokazujesz klientom (bez trailing <code>/</code>).</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			}
		>
			<Card>
				<CardHeader>
					<CardTitle>Status integracji</CardTitle>
					<CardDescription>Podglad biezacych danych z backendu.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<dl className="grid gap-3 text-sm">
						<div>
							<dt className="text-muted-foreground">Zamowienia do potwierdzenia</dt>
							<dd className="text-base font-semibold">{pendingReviewCount}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Ostatnie zdarzenie webhooka</dt>
							<dd className="flex flex-wrap items-center gap-2">
								{lastEvent ? (
									<>
										<Badge className={levelBadgeClass(lastEvent.level)}>{lastEvent.level}</Badge>
										<span>{formatTimestamp(lastEvent.createdAt)}</span>
									</>
								) : (
									<span>Brak zdarzen</span>
								)}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Ostatnia wiadomosc</dt>
							<dd className="text-xs text-foreground/80">
								{lastEvent?.message ?? 'Brak wpisow w logach integracji.'}
							</dd>
						</div>
					</dl>
				</CardContent>
			</Card>
		</SettingsView>
	);
}
