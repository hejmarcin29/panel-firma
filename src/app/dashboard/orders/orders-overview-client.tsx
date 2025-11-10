'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { confirmManualOrder } from './actions';
import type { Order, OrderTimelineState } from './data';

type OrdersOverviewClientProps = {
	initialOrders: Order[];
};

const TIMELINE_STATE_LABELS: Record<OrderTimelineState, string> = {
	completed: 'Zakończone',
	current: 'W toku',
	pending: 'Oczekujące',
};

function formatCurrency(amount: number, currency: string) {
	if (!Number.isFinite(amount)) {
		return '—';
	}

	try {
		return new Intl.NumberFormat('pl-PL', {
			style: 'currency',
			currency,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${amount.toFixed(2)} ${currency}`;
	}
}

function formatDateTime(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
}

export function OrdersOverviewClient({ initialOrders }: OrdersOverviewClientProps) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrders[0]?.id ?? null);
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [isConfirming, startConfirmTransition] = useTransition();

	const selectedOrder = useMemo(
		() => orders.find((order) => order.id === selectedOrderId) ?? null,
		[orders, selectedOrderId],
	);

	const pendingReviewCount = useMemo(
		() => orders.filter((order) => order.requiresReview).length,
		[orders],
	);

	function handleSelect(id: string) {
		setSelectedOrderId(id);
		setFeedback(null);
	}

	function handleConfirm(orderId: string) {
		setFeedback(null);
		startConfirmTransition(async () => {
			try {
				const updated = await confirmManualOrder(orderId);
				setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)));
				setFeedback({ type: 'success', message: `Zamówienie ${updated.reference} zostało potwierdzone.` });
			} catch (error) {
				setFeedback({
					type: 'error',
					message: error instanceof Error ? error.message : 'Nie udało się potwierdzić zamówienia.',
				});
			}
		});
	}

	return (
		<section className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Ręcznie dodane zamówienia</h1>
					<p className="text-sm text-muted-foreground">
						Przeglądaj zamówienia utworzone w panelu administracyjnym oraz zaimportowane z innych kanałów.
					</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/orders/new">Dodaj zamówienie</Link>
				</Button>
			</div>

			<Alert className={cn('border-amber-300 text-amber-900', pendingReviewCount ? 'bg-amber-50' : 'bg-muted')}>
				<AlertTitle>Do potwierdzenia: {pendingReviewCount}</AlertTitle>
				<AlertDescription>
					{pendingReviewCount > 0
						? 'Nowe zamówienia z WooCommerce wymagają ręcznego zatwierdzenia przed dalszą realizacją.'
						: 'Brak zamówień oczekujących na potwierdzenie.'}
				</AlertDescription>
			</Alert>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Ostatnie zamówienia</CardTitle>
						<CardDescription>Wybierz zamówienie, aby zobaczyć wszystkie szczegóły.</CardDescription>
					</CardHeader>
					<CardContent>
						{orders.length ? (
							<ScrollArea className="max-h-[500px] pr-4">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Numer</TableHead>
											<TableHead>Klient</TableHead>
											<TableHead>Kanał</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Kwota brutto</TableHead>
											<TableHead className="text-right">Data</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{orders.map((order) => (
											<TableRow
												key={order.id}
												className={cn(
													'cursor-pointer transition-colors',
													selectedOrderId === order.id ? 'bg-muted' : 'hover:bg-muted/60',
													order.requiresReview ? 'border-l-2 border-l-amber-400' : '',
												)}
												onClick={() => handleSelect(order.id)}
												onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													handleSelect(order.id);
												}
												}}
												tabIndex={0}
												role="button"
											>
												<TableCell className="font-medium">
													<div className="flex flex-wrap items-center gap-2">
														<span>{order.reference}</span>
														{order.source === 'woocommerce' ? <Badge variant="outline">WooCommerce</Badge> : null}
														{order.requiresReview ? <Badge variant="destructive">Do potwierdzenia</Badge> : null}
													</div>
												</TableCell>
												<TableCell>{order.customer}</TableCell>
												<TableCell>{order.channel}</TableCell>
												<TableCell>
													<Badge variant="outline">{order.status}</Badge>
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(order.totals.totalGross, order.currency)}
												</TableCell>
												<TableCell className="text-right text-sm text-muted-foreground">
													{formatDateTime(order.createdAt)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</ScrollArea>
						) : (
							<Empty className="border border-dashed">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<span className="text-2xl">🗂️</span>
									</EmptyMedia>
									<EmptyTitle>Brak zamówień</EmptyTitle>
									<EmptyDescription>Dodaj pierwsze ręczne zamówienie, aby zobaczyć je na liście.</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button asChild>
										<Link href="/dashboard/orders/new">Dodaj zamówienie</Link>
									</Button>
								</EmptyContent>
							</Empty>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Szczegóły zamówienia</CardTitle>
						<CardDescription>Pełne informacje o klientach, pozycjach i statusach.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{selectedOrder ? (
							<div className="space-y-6">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<h3 className="text-xl font-semibold">{selectedOrder.reference}</h3>
										<div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
											<p>
												Kanał: {selectedOrder.channel} • Utworzono: {formatDateTime(selectedOrder.createdAt)}
											</p>
											<Badge variant="outline">{selectedOrder.source === 'woocommerce' ? 'WooCommerce' : 'Manualne'}</Badge>
										</div>
									</div>
									<div className="flex flex-col gap-2 text-right">
										<Badge className="ml-auto" variant="secondary">
											{selectedOrder.status}
										</Badge>
										<p className="text-sm text-muted-foreground">Ostatnia aktualizacja: {formatDateTime(selectedOrder.updatedAt)}</p>
										<p className="text-lg font-semibold">
											{formatCurrency(selectedOrder.totals.totalGross, selectedOrder.currency)}
										</p>
									</div>
								</div>

								{selectedOrder.source === 'woocommerce' ? (
									<p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
										To zamówienie zostało zaimportowane ze sklepu online (WooCommerce).
									</p>
								) : null}

								{feedback ? (
									<Alert
										className={cn(
											feedback.type === 'success'
												? 'border-emerald-300 bg-emerald-50 text-emerald-900'
												: 'border-destructive/50',
										)}
										variant={feedback.type === 'error' ? 'destructive' : 'default'}
									>
										<AlertTitle>{feedback.type === 'success' ? 'Potwierdzono' : 'Błąd'}</AlertTitle>
										<AlertDescription>{feedback.message}</AlertDescription>
									</Alert>
								) : null}

								{selectedOrder.requiresReview ? (
									<div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Zamówienie czeka na potwierdzenie.</span>
											<span>
												Zweryfikuj dane klienta i pozycje. Po potwierdzeniu zamówienie trafi do dalszej obsługi.
											</span>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												onClick={() => handleConfirm(selectedOrder.id)}
												disabled={isConfirming}
											>
												{isConfirming ? 'Potwierdzanie…' : 'Potwierdź zamówienie'}
											</Button>
										</div>
									</div>
								) : null}

								<Separator />

								<div>
									<h4 className="text-sm font-semibold uppercase text-muted-foreground">Pozycje</h4>
									<Table className="mt-3">
										<TableHeader>
											<TableRow>
												<TableHead>Produkt</TableHead>
												<TableHead>Ilość</TableHead>
												<TableHead>Cena netto</TableHead>
												<TableHead>VAT</TableHead>
												<TableHead className="text-right">Brutto</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{selectedOrder.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell className="font-medium">{item.product}</TableCell>
													<TableCell>{item.quantity}</TableCell>
													<TableCell>{formatCurrency(item.unitPrice, selectedOrder.currency)}</TableCell>
													<TableCell>{item.vatRate}%</TableCell>
													<TableCell className="text-right font-medium">
														{formatCurrency(item.totalGross, selectedOrder.currency)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								<Separator />

								<div className="grid gap-6 md:grid-cols-2">
									<div className="space-y-2">
										<h4 className="text-sm font-semibold uppercase text-muted-foreground">Faktura</h4>
										<div className="text-sm leading-6">
											<p>{selectedOrder.billing.name}</p>
											<p>{selectedOrder.billing.street}</p>
											<p>
												{selectedOrder.billing.postalCode} {selectedOrder.billing.city}
											</p>
											<p>{selectedOrder.billing.phone}</p>
											<p>{selectedOrder.billing.email}</p>
										</div>
									</div>
									<div className="space-y-2">
										<h4 className="text-sm font-semibold uppercase text-muted-foreground">Wysyłka</h4>
										<div className="text-sm leading-6">
											{selectedOrder.shipping.sameAsBilling ? (
												<p>Dane identyczne jak do faktury.</p>
											) : (
												<>
													<p>{selectedOrder.shipping.name}</p>
													<p>{selectedOrder.shipping.street}</p>
													<p>
														{selectedOrder.shipping.postalCode} {selectedOrder.shipping.city}
													</p>
													<p>{selectedOrder.shipping.phone}</p>
													<p>{selectedOrder.shipping.email}</p>
												</>
											)}
										</div>
									</div>
								</div>

								<Separator />

								<div className="space-y-4">
									<h4 className="text-sm font-semibold uppercase text-muted-foreground">Oś czasu</h4>
									<div className="space-y-4">
										{selectedOrder.statuses.map((entry) => (
											<div key={entry.id} className="rounded-lg border p-4">
												<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
													<div>
														<p className="text-sm font-medium text-foreground">{entry.title}</p>
														<p className="text-sm text-muted-foreground">{entry.description}</p>
													</div>
													<div className="flex flex-col items-start gap-2 text-sm md:items-end">
														<Badge
															variant={entry.state === 'pending' ? 'outline' : entry.state === 'current' ? 'secondary' : 'default'}
														>
															{TIMELINE_STATE_LABELS[entry.state]}
														</Badge>
														{entry.timestamp ? (
															<time className="text-xs text-muted-foreground" dateTime={entry.timestamp}>
																{formatDateTime(entry.timestamp)}
															</time>
														) : null}
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						) : (
							<Empty className="border border-dashed">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<span className="text-2xl">📝</span>
									</EmptyMedia>
									<EmptyTitle>Wybierz zamówienie</EmptyTitle>
									<EmptyDescription>Kliknij zamówienie z listy, aby zobaczyć szczegóły.</EmptyDescription>
								</EmptyHeader>
							</Empty>
						)}
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

export default OrdersOverviewClient;
