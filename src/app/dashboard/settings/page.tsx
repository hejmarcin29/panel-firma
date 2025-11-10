import { headers } from 'next/headers';
import { desc, eq, sql } from 'drizzle-orm';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/db';
import { integrationLogs, manualOrders } from '@/lib/db/schema';

type LogLevel = 'info' | 'warning' | 'error';

type LogRow = {
	id: string;
	createdAt: number | null;
	level: LogLevel;
	message: string;
};

function maskSecret(secret: string) {
	if (secret.length <= 8) {
		return `${secret[0] ?? ''}***${secret.at(-1) ?? ''}`;
	}

	return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function formatTimestamp(value: number | null | undefined) {
	if (!value) {
		return 'brak';
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'short',
		timeStyle: 'medium',
	}).format(new Date(value));
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

	const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET ?? '';
	const secretConfigured = Boolean(webhookSecret);
	const maskedSecret = secretConfigured ? maskSecret(webhookSecret) : null;

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

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Webhook WooCommerce</CardTitle>
						<CardDescription>Ustaw dane ponizej w panelu WordPress, aby zamowienia trafialy do systemu.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<dl className="grid gap-3 text-sm">
							<div>
								<dt className="text-muted-foreground">Adres URL dostawy</dt>
								<dd className="font-mono text-xs break-all rounded bg-muted px-3 py-2">{webhookUrl}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Sekret webhooka</dt>
								<dd className="font-mono text-xs break-all rounded bg-muted px-3 py-2">
									{maskedSecret ?? 'brak - ustaw zmienna WOOCOMMERCE_WEBHOOK_SECRET'}
								</dd>
							</div>
						</dl>
						<ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
							<li>Temat webhooka: <code>order.created</code></li>
							<li>Wersja API: <code>WP REST API v3</code></li>
							<li>W laczu SSL uzyj tego samego hosta, na ktorym dziala panel.</li>
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
