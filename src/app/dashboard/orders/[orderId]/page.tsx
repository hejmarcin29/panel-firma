import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, CircleDot, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

import { getManualOrderById } from '../actions';
import { ConfirmOrderButton } from '../_components/confirm-order-button';
import type { Order, OrderTimelineState } from '../data';

type OrderDetailsPageProps = {
	params: {
		orderId: string;
	};
};

const iconByState: Record<OrderTimelineState, LucideIcon> = {
	completed: CheckCircle2,
	current: CircleDot,
	pending: Circle,
};

const badgeVariantByState: Record<OrderTimelineState, 'default' | 'secondary' | 'outline'> = {
	completed: 'secondary',
	current: 'default',
	pending: 'outline',
};

const stateLabel: Record<OrderTimelineState, string> = {
	completed: 'Zrealizowane',
	current: 'W toku',
	pending: 'Oczekuje',
};

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

function formatDate(date: string) {
	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(date));
}

function formatNumber(value: number | null | undefined) {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return '--';
	}

	return new Intl.NumberFormat('pl-PL', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function computePackageArea(item: Order['items'][number]) {
	if (!item.unitPricePerSquareMeter || item.unitPricePerSquareMeter <= 0) {
		return null;
	}

	const area = item.unitPrice / item.unitPricePerSquareMeter;
	return Number.isFinite(area) && area > 0 ? area : null;
}

function computeTotalArea(item: Order['items'][number]) {
	const perPackage = computePackageArea(item);
	if (perPackage === null) {
		return null;
	}

	const total = perPackage * item.quantity;
	return Number.isFinite(total) && total > 0 ? total : null;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
	await requireUser();

	const orderData = await getManualOrderById(params.orderId);

	if (!orderData) {
		notFound();
	}

	const order: Order = orderData;
	const statuses = order.statuses;

	const currentStatus = statuses.find((status) => status.state === 'current');
	const completedSteps = statuses.filter((status) => status.state === 'completed').length;
	const totalSquareMeters = order.items.reduce((sum, item) => {
		const total = computeTotalArea(item);
		return sum + (total ?? 0);
	}, 0);

	return (
		<section className="space-y-10">
			<Link
				href="/dashboard/orders"
				className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				Powrót do listy zamówień
			</Link>

			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">{order.reference}</h1>
					<p className="text-sm text-muted-foreground">
						Kanał sprzedaży: <span className="font-medium text-foreground">{order.channel}</span>
					</p>
					{currentStatus ? (
						<p className="text-xs text-muted-foreground">
							Aktualny krok: <span className="font-medium text-foreground">{currentStatus.title}</span>
						</p>
					) : null}
				</div>
				<div className="flex flex-col items-end gap-3 text-right">
					<Badge variant="secondary">{order.status}</Badge>
					<p className="text-sm text-muted-foreground">Łącznie m2: {formatNumber(totalSquareMeters)}</p>
					{order.requiresReview ? <ConfirmOrderButton orderId={order.id} /> : null}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Szczegóły zamówienia</CardTitle>
					<CardDescription>Najważniejsze dane finansowe i kontaktowe klienta.</CardDescription>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-6 md:grid-cols-3">
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Klient</dt>
							<dd className="text-sm text-foreground">{order.billing.name}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Kanał</dt>
							<dd className="text-sm text-foreground">{order.channel}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Źródło</dt>
							<dd className="text-sm text-foreground">
								{order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
							</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">E-mail</dt>
							<dd className="text-sm text-foreground">{order.billing.email}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Telefon</dt>
							<dd className="text-sm text-foreground">{order.billing.phone}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Suma netto</dt>
							<dd className="text-sm text-foreground">
								{formatCurrency(order.totals.totalNet, order.currency)}
							</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Suma brutto</dt>
							<dd className="text-sm font-medium text-foreground">
								{formatCurrency(order.totals.totalGross, order.currency)}
							</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Postęp</dt>
							<dd className="text-sm text-foreground">
								{completedSteps}/{statuses.length} kroków ukończonych
							</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Utworzone</dt>
							<dd className="text-sm text-foreground">{formatDate(order.createdAt)}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Ostatnia aktualizacja</dt>
							<dd className="text-sm text-foreground">{formatDate(order.updatedAt)}</dd>
						</div>
						<div className="space-y-1">
							<dt className="text-xs font-medium uppercase text-muted-foreground">Łącznie m2</dt>
							<dd className="text-sm text-foreground">{formatNumber(totalSquareMeters)}</dd>
						</div>
					</dl>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Adresy</CardTitle>
					<CardDescription>Dane rozliczeniowe i dostawy powiązane z zamówieniem.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<h3 className="text-sm font-semibold uppercase text-muted-foreground">Faktura</h3>
							<div className="text-sm leading-6">
								<p>{order.billing.name}</p>
								<p>{order.billing.street}</p>
								<p>
									{order.billing.postalCode} {order.billing.city}
								</p>
								<p>{order.billing.phone}</p>
								<p>{order.billing.email}</p>
							</div>
						</div>
						<div className="space-y-2">
							<h3 className="text-sm font-semibold uppercase text-muted-foreground">Wysyłka</h3>
							<div className="text-sm leading-6">
								{order.shipping.sameAsBilling ? (
									<p>Dane identyczne jak do faktury.</p>
								) : (
									<>
										<p>{order.shipping.name}</p>
										<p>{order.shipping.street}</p>
										<p>
											{order.shipping.postalCode} {order.shipping.city}
										</p>
										<p>{order.shipping.phone}</p>
										<p>{order.shipping.email}</p>
									</>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Pozycje zamówienia</CardTitle>
					<CardDescription>Szczegółowe informacje o produktach, metrach kwadratowych i stawkach VAT.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produkt</TableHead>
								<TableHead>Ilość</TableHead>
								<TableHead>M2 w op.</TableHead>
								<TableHead>M2 łącznie</TableHead>
								<TableHead>VAT</TableHead>
								<TableHead>Cena netto</TableHead>
								<TableHead className="text-right">Kwota brutto</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{order.items.map((item) => {
								const perPackageArea = computePackageArea(item);
								const totalArea = computeTotalArea(item);

								return (
									<TableRow key={item.id}>
										<TableCell className="font-medium">{item.product}</TableCell>
										<TableCell>{formatNumber(item.quantity)}</TableCell>
										<TableCell>{formatNumber(perPackageArea)}</TableCell>
										<TableCell>{formatNumber(totalArea)}</TableCell>
										<TableCell>{item.vatRate}%</TableCell>
										<TableCell>{formatCurrency(item.unitPrice, order.currency)}</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(item.totalGross, order.currency)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Timeline statusów</CardTitle>
					<CardDescription>Historia zmian statusów wraz z kontekstem operacyjnym.</CardDescription>
				</CardHeader>
				<CardContent>
					<ol className="space-y-6 border-l border-border pl-6">
						{statuses.map((status) => {
							const Icon = iconByState[status.state];

							return (
								<li key={status.id} className="relative pl-2">
									<span
										className={cn(
											'absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background',
											{
												'border-emerald-500 text-emerald-500': status.state === 'completed',
												'border-primary text-primary': status.state === 'current',
												'border-muted text-muted-foreground': status.state === 'pending',
											},
										)}
									>
										<Icon className="h-3.5 w-3.5" />
									</span>
									<div className="space-y-1">
										<div className="flex flex-wrap items-center gap-3">
											<p className="text-sm font-medium text-foreground">{status.title}</p>
											<Badge variant={badgeVariantByState[status.state]}>{stateLabel[status.state]}</Badge>
										</div>
										<p className="text-sm text-muted-foreground">{status.description}</p>
										<p className="text-xs text-muted-foreground">
											{status.timestamp ? formatDate(status.timestamp) : 'Oczekuje na aktualizację'}
										</p>
									</div>
								</li>
							);
						})}
					</ol>
				</CardContent>
			</Card>
		</section>
	);
}
