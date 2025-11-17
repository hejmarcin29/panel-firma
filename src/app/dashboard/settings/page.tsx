import Link from 'next/link';
import { headers } from 'next/headers';
import { desc, eq, sql } from 'drizzle-orm';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { integrationLogs, mailAccounts, manualOrders } from '@/lib/db/schema';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getWfirmaConfig, tryGetWfirmaConfig } from '@/lib/wfirma/config';
import { WebhookSecretForm } from './_components/webhook-secret-form';
import { WfirmaConfigForm } from './_components/wfirma-config-form';

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
		wfirmaTenantSetting,
		wfirmaAppKeySetting,
		wfirmaAppSecretSetting,
		wfirmaAccessKeySetting,
		wfirmaAccessSecretSetting,
	] = await Promise.all([
		getAppSetting(appSettingKeys.wooWebhookSecret),
		getAppSetting(appSettingKeys.wfirmaTenant),
		getAppSetting(appSettingKeys.wfirmaAppKey),
		getAppSetting(appSettingKeys.wfirmaAppSecret),
		getAppSetting(appSettingKeys.wfirmaAccessKey),
		getAppSetting(appSettingKeys.wfirmaAccessSecret),
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
		.limit(10);

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

	const wfirmaConfig = await tryGetWfirmaConfig();
	let wfirmaConfigError: string | null = null;

	if (!wfirmaConfig) {
		try {
			await getWfirmaConfig();
		} catch (configError) {
			wfirmaConfigError =
				configError instanceof Error
					? configError.message
					: 'Brakuje konfiguracji wFirma. Uzupelnij dane w ustawieniach panelu.';
		}
	}

	const wfirmaStatus = wfirmaConfig ? 'configured' : 'missing';
	const wfirmaStatusBadgeClass =
		wfirmaStatus === 'configured'
			? 'bg-emerald-100 text-emerald-900 border-transparent'
			: 'border border-dashed text-muted-foreground';
	const wfirmaStatusLabel = wfirmaConfig ? 'Skonfigurowano' : 'Brak konfiguracji';

	const mailRows = await db
		.select({
			id: mailAccounts.id,
			displayName: mailAccounts.displayName,
			email: mailAccounts.email,
			status: mailAccounts.status,
			lastSyncAt: mailAccounts.lastSyncAt,
		})
		.from(mailAccounts)
		.orderBy(mailAccounts.displayName);

	const mailAccountCount = mailRows.length;
	const mailConnectedCount = mailRows.filter((row) => row.status === 'connected').length;

	let latestMailSync: number | null = null;
	for (const row of mailRows) {
		const value =
			row.lastSyncAt instanceof Date
				? row.lastSyncAt.getTime()
				: typeof row.lastSyncAt === 'number'
					? row.lastSyncAt
					: null;
		if (value !== null && (latestMailSync === null || value > latestMailSync)) {
			latestMailSync = value;
		}
	}

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Ustawienia</h1>
				<p className="text-muted-foreground text-sm">
					Kontroluj konfiguracje integracji WooCommerce i sprawdzaj, czy import zamowien dziala poprawnie.
				</p>
			</div>

			{!secretConfigured && (
				<Alert variant="destructive">
					<AlertTitle>Brakuje sekretu webhooka</AlertTitle>
					<AlertDescription>
						Ustaw sekret w formularzu ponizej, aby aktywowac weryfikacje webhookow WooCommerce.
					</AlertDescription>
				</Alert>
			)}


			<div className="grid gap-6 lg:grid-cols-2">
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

				<Card>
					<CardHeader>
						<CardTitle>Poczta firmowa</CardTitle>
						<CardDescription>Stan skrzynek pocztowych dostepnych w panelu.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<dl className="grid gap-3 text-sm">
							<div>
								<dt className="text-muted-foreground">Liczba skrzynek</dt>
								<dd className="text-base font-semibold">{mailAccountCount}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Aktywne polaczenia</dt>
								<dd className="text-base font-semibold">{mailConnectedCount}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Ostatnia synchronizacja</dt>
								<dd className="text-sm text-muted-foreground">
									{latestMailSync ? formatTimestamp(latestMailSync) : 'Brak danych'}
								</dd>
							</div>
						</dl>

						{mailAccountCount === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nie skonfigurowano jeszcze zadnej skrzynki. Dodaj konto w ustawieniach, aby odbierac i wysylac wiadomosci.
							</p>
						) : (
							<ul className="space-y-2">
								{mailRows.map((account) => (
									<li key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
										<div className="space-y-1">
											<p className="text-sm font-medium text-foreground">{account.displayName}</p>
											<p className="text-xs text-muted-foreground">{account.email}</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="secondary">{account.status}</Badge>
											<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
												{account.lastSyncAt ? formatTimestamp(account.lastSyncAt) : 'bez synchronizacji'}
											</span>
										</div>
									</li>
								))}
							</ul>
						)}

						<div className="flex flex-wrap gap-2">
							<Button asChild>
								<Link href="/dashboard/mail">Otworz skrzynke</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/dashboard/settings/mail">Konfiguracja</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

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

				<Card>
					<CardHeader>
						<CardTitle>Integracja wFirma</CardTitle>
						<CardDescription>Zarzadzaj danymi logowania do wFirma bezposrednio w panelu.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<Badge className={wfirmaStatusBadgeClass}>{wfirmaStatusLabel}</Badge>
							{wfirmaConfig?.tenant ? (
								<span className="text-muted-foreground">Tenant {wfirmaConfig.tenant}</span>
							) : null}
						</div>
						{wfirmaConfigError ? (
							<p className="text-xs text-destructive">{wfirmaConfigError}</p>
						) : null}
						<WfirmaConfigForm
							initialTenant={wfirmaTenantSetting ?? ''}
							initialAppKey={wfirmaAppKeySetting ?? ''}
							initialAppSecret={wfirmaAppSecretSetting ?? ''}
							initialAccessKey={wfirmaAccessKeySetting ?? ''}
							initialAccessSecret={wfirmaAccessSecretSetting ?? ''}
						/>
						<div className="space-y-2 text-xs text-muted-foreground">
							<p>Dane przechowujemy w bazie danych. Zmiana w formularzu od razu zastapi konfiguracje srodowiska.</p>
							<ul className="list-disc space-y-1 pl-5">
								<li><code>WFIRMA_APP_KEY</code> — publiczny identyfikator aplikacji OAuth.</li>
								<li><code>WFIRMA_APP_SECRET</code> — sekretny klucz aplikacji OAuth.</li>
								<li><code>WFIRMA_ACCESS_KEY</code> — klucz dostepowy generowany w panelu wFirma.</li>
								<li><code>WFIRMA_ACCESS_SECRET</code> — sekretny klucz dostepowy przypisany do konta.</li>
								<li><code>WFIRMA_TENANT</code> — subdomena (np. <code>nazwa</code> dla <code>nazwa.wfirma.pl</code>).</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Logi integracji</CardTitle>
					<CardDescription>Ostatnie wpisy zapisywane podczas przetwarzania webhooka.</CardDescription>
				</CardHeader>
				<CardContent>
					{logs.length === 0 ? (
						<p className="text-sm text-muted-foreground">Brak logow dla integracji WooCommerce.</p>
					) : (
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
					)}
				</CardContent>
			</Card>
		</div>
	);
}
