import Link from 'next/link';
import { headers } from 'next/headers';
import { desc, eq, sql } from 'drizzle-orm';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { integrationLogs, manualOrders, wfirmaTokens } from '@/lib/db/schema';
import { disconnectWfirmaIntegration } from './actions';
import { WebhookSecretForm } from './_components/webhook-secret-form';

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

type SettingsPageProps = {
	searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps = {}) {
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

	const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET ?? '';
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

	const [wfirmaRow] = await db
		.select({
			id: wfirmaTokens.id,
			tenant: wfirmaTokens.tenant,
			scope: wfirmaTokens.scope,
			expiresAt: wfirmaTokens.expiresAt,
			updatedAt: wfirmaTokens.updatedAt,
		})
		.from(wfirmaTokens)
		.limit(1);

	const wfirmaToken = wfirmaRow
		? {
			id: wfirmaRow.id,
			tenant: wfirmaRow.tenant ?? '',
			scope: wfirmaRow.scope ?? '',
			expiresAt:
				wfirmaRow.expiresAt instanceof Date
					? wfirmaRow.expiresAt
					: typeof wfirmaRow.expiresAt === 'number'
						? new Date(wfirmaRow.expiresAt)
						: null,
			updatedAt:
				wfirmaRow.updatedAt instanceof Date
					? wfirmaRow.updatedAt
					: typeof wfirmaRow.updatedAt === 'number'
						? new Date(wfirmaRow.updatedAt)
						: null,
		}
		: null;

	const wfirmaScopes = wfirmaToken?.scope?.split(/[\s,]+/).filter(Boolean) ?? [];
	const wfirmaStatus = wfirmaToken ? 'connected' : 'disconnected';
	const wfirmaStatusBadgeClass =
		wfirmaStatus === 'connected'
			? 'bg-emerald-100 text-emerald-900 border-transparent'
			: 'border border-dashed text-muted-foreground';
	const wfirmaStatusLabel = wfirmaStatus === 'connected' ? 'Polaczono' : 'Brak polaczenia';

	const wfirmaFlashParam = searchParams?.wfirma;
	const wfirmaFlash = Array.isArray(wfirmaFlashParam) ? wfirmaFlashParam[0] : wfirmaFlashParam ?? null;

	const wfirmaAlert = (() => {
		if (wfirmaFlash === 'connected') {
			return {
				variant: 'default' as const,
				title: 'Polaczenie z wFirma zakonczone sukcesem',
				description: 'Token zostal zapisany. Mozesz przejsc do generowania dokumentow VAT.',
			};
		}
		if (wfirmaFlash === 'error') {
			return {
				variant: 'destructive' as const,
				title: 'Nie udalo sie polaczyc z wFirma',
				description: 'Sprobuj ponownie. Jesli blad sie powtarza sprawdz konfiguracje WFIRMA_CLIENT_ID i WFIRMA_REDIRECT_URI.',
			};
		}
		return null;
	})();

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
						Dodaj zmienna srodowiskowa <code>WOOCOMMERCE_WEBHOOK_SECRET</code> do pliku <code>.env.local</code> lub konfiguracji
						serwisu, a nastepnie zrestartuj aplikacje.
					</AlertDescription>
				</Alert>
			)}

			{wfirmaAlert && (
				<Alert variant={wfirmaAlert.variant}>
					<AlertTitle>{wfirmaAlert.title}</AlertTitle>
					<AlertDescription>{wfirmaAlert.description}</AlertDescription>
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
							<li>W pliku .env.local przechowujemy wpis <code>WOOCOMMERCE_WEBHOOK_SECRET=...</code>.</li>
						</ul>
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
						<CardDescription>Zarzadzaj autoryzacja OAuth i stanem polaczenia.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<Badge className={wfirmaStatusBadgeClass}>{wfirmaStatusLabel}</Badge>
							{wfirmaToken?.updatedAt && <span className="text-muted-foreground">Aktualizacja {formatTimestamp(wfirmaToken.updatedAt)}</span>}
						</div>
						{wfirmaToken ? (
							<dl className="grid gap-3 text-sm">
								<div>
									<dt className="text-muted-foreground">Tenant</dt>
									<dd className="font-mono text-xs break-all bg-muted px-3 py-2 rounded">{wfirmaToken.tenant}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Zakres</dt>
									<dd className="flex flex-wrap gap-2 text-xs text-muted-foreground">
										{wfirmaScopes.length === 0
											? 'brak'
											: wfirmaScopes.map((scope) => (
												<Badge key={scope} variant="secondary" className="font-medium">
													{scope}
												</Badge>
											))}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Wygasa</dt>
									<dd>{wfirmaToken.expiresAt ? formatTimestamp(wfirmaToken.expiresAt) : 'czas nieokreslony'}</dd>
								</div>
							</dl>
						) : (
							<p className="text-sm text-muted-foreground">
								Brak aktywnego tokena. Rozpocznij autoryzacje, aby system mogl wysylac dokumenty do wFirma.
							</p>
						)}
						<div className="flex flex-wrap gap-2">
							<Button asChild>
								<Link href="/api/wfirma/authorize">{wfirmaToken ? 'Odswiez token' : 'Polacz z wFirma'}</Link>
							</Button>
							{wfirmaToken && (
								<form action={disconnectWfirmaIntegration}>
									<Button variant="outline" type="submit">Odlacz</Button>
								</form>
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							Po kliknieciu przekierujemy Cie do panelu wFirma w celu potwierdzenia dostepu.
						</p>
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
										<TableCell className="max-w-[28rem] whitespace-normal text-xs">
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
