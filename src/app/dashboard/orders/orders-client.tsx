'use client';

import { useMemo, useState, useTransition } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { createManualOrder } from './actions';
import type { ManualOrderPayload, Order, OrderTimelineState } from './data';
import { channelOptions, statusOptions } from './utils';

type ManualOrderDraftItem = {
	product: string;
	quantity: string;
	unitPrice: string;
	vatRate: string;
	unitPricePerSquareMeter: string;
	squareMetersPerPackage: string;
};

type ManualOrderDraft = {
	reference: string;
	status: string;
	channel: string;
	currency: string;
	notes: string;
	billing: {
		name: string;
		street: string;
		postalCode: string;
		city: string;
		phone: string;
		email: string;
	};
	shipping: {
		name: string;
		street: string;
		postalCode: string;
		city: string;
		phone: string;
		email: string;
		sameAsBilling: boolean;
	};
	items: ManualOrderDraftItem[];
};

type DerivedOrderItem = {
	product: string;
	quantity: number;
	unitPrice: number;
	vatRate: number;
	unitPricePerSquareMeter: number;
	unitPriceGross: number;
	packageSquareMeters: number;
	totalNet: number;
	totalGross: number;
};

type OrdersClientProps = {
	initialOrders: Order[];
};

const TIMELINE_STATE_LABELS: Record<OrderTimelineState, string> = {
	completed: 'Zakończone',
	current: 'W toku',
	pending: 'Oczekujące',
};

function createEmptyItem(): ManualOrderDraftItem {
	return {
		product: '',
		quantity: '1',
		unitPrice: '0',
		vatRate: '23',
		unitPricePerSquareMeter: '',
		squareMetersPerPackage: '',
	};
}

function createInitialDraft(): ManualOrderDraft {
	return {
		reference: '',
		status: statusOptions[0] ?? 'Nowe',
		channel: channelOptions[0] ?? 'Sklep online',
		currency: 'PLN',
		notes: '',
		billing: {
			name: '',
			street: '',
			postalCode: '',
			city: '',
			phone: '',
			email: '',
		},
		shipping: {
			name: '',
			street: '',
			postalCode: '',
			city: '',
			phone: '',
			email: '',
			sameAsBilling: true,
		},
		items: [createEmptyItem()],
	};
}

function parseNumber(value: string) {
	const normalized = value.replace(',', '.');
	const numeric = Number.parseFloat(normalized);
	return Number.isFinite(numeric) ? numeric : 0;
}

function roundMoney(value: number) {
	return Math.round(value * 100) / 100;
}

function formatMoneyInput(value: number) {
	return Number.isFinite(value) ? roundMoney(value).toFixed(2) : '';
}

function deriveItem(values: ManualOrderDraftItem): DerivedOrderItem {
	const quantity = parseNumber(values.quantity);
	const vatRate = parseNumber(values.vatRate);
	const packageSquareMeters = parseNumber(values.squareMetersPerPackage);
	let unitPrice = parseNumber(values.unitPrice);
	let unitPricePerSquareMeter = parseNumber(values.unitPricePerSquareMeter);

	if (unitPricePerSquareMeter > 0 && packageSquareMeters > 0) {
		unitPrice = roundMoney(unitPricePerSquareMeter * packageSquareMeters);
	} else if (unitPrice > 0 && packageSquareMeters > 0) {
		unitPricePerSquareMeter = roundMoney(unitPrice / packageSquareMeters);
	}

	const unitPriceGross = roundMoney(unitPrice * (1 + vatRate / 100));
	const net = roundMoney(quantity * unitPrice);
	const gross = roundMoney(quantity * unitPriceGross);

	return {
		product: values.product.trim(),
		quantity,
		unitPrice,
		vatRate,
		unitPricePerSquareMeter,
		unitPriceGross,
		packageSquareMeters,
		totalNet: net,
		totalGross: gross,
	};
}

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

export function OrdersClient({ initialOrders }: OrdersClientProps) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrders[0]?.id ?? null);
	const [draft, setDraft] = useState<ManualOrderDraft>(() => createInitialDraft());
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const derivedItems = useMemo(() => draft.items.map(deriveItem), [draft.items]);
	const totals = useMemo(
		() =>
			derivedItems.reduce(
				(acc, item) => ({
					net: acc.net + item.totalNet,
					gross: acc.gross + item.totalGross,
				}),
				{ net: 0, gross: 0 },
			),
		[derivedItems],
	);

	const selectedOrder = useMemo(
		() => orders.find((order) => order.id === selectedOrderId) ?? null,
		[orders, selectedOrderId],
	);

	function handleBillingChange(field: keyof ManualOrderDraft['billing'], value: string) {
		setDraft((previous) => {
			const nextBilling = { ...previous.billing, [field]: value };
			const nextShipping = previous.shipping.sameAsBilling
				? { ...previous.shipping, [field]: value }
				: previous.shipping;

			return {
				...previous,
				billing: nextBilling,
				shipping: nextShipping,
			};
		});
	}

	function handleShippingChange(field: keyof ManualOrderDraft['shipping'], value: string) {
		setDraft((previous) => ({
			...previous,
			shipping: {
				...previous.shipping,
				[field]: value,
			},
		}));
	}

	function handleShippingToggle(value: boolean) {
		setDraft((previous) => ({
			...previous,
			shipping: value
				? {
					...previous.billing,
					sameAsBilling: true,
				}
				: {
					...previous.shipping,
					sameAsBilling: false,
				},
		}));
	}

	function handleItemChange(index: number, field: keyof ManualOrderDraftItem, value: string) {
		setDraft((previous) => {
			const nextItems = previous.items.map((item, itemIndex) =>
				itemIndex === index
					? (() => {
						const updated: ManualOrderDraftItem = { ...item, [field]: value };
						const area = parseNumber(field === 'squareMetersPerPackage' ? value : updated.squareMetersPerPackage);
						const unitPricePerSq = parseNumber(field === 'unitPricePerSquareMeter' ? value : updated.unitPricePerSquareMeter);

						if (field === 'unitPricePerSquareMeter' || field === 'squareMetersPerPackage') {
							if (area > 0 && unitPricePerSq > 0) {
								updated.unitPrice = formatMoneyInput(unitPricePerSq * area);
							}
						}

						if (field === 'unitPrice' || field === 'squareMetersPerPackage') {
							const resolvedUnitPrice = field === 'unitPrice' ? parseNumber(value) : parseNumber(updated.unitPrice);
							if (area > 0 && resolvedUnitPrice > 0) {
								updated.unitPricePerSquareMeter = formatMoneyInput(resolvedUnitPrice / area);
							}
						}

						return updated;
					})()
					: item,
			);
			return { ...previous, items: nextItems };
		});
	}

	function handleAddItem() {
		setDraft((previous) => ({
			...previous,
			items: [...previous.items, createEmptyItem()],
		}));
	}

	function handleRemoveItem(index: number) {
		setDraft((previous) => {
			if (previous.items.length === 1) {
				return previous;
			}

			const nextItems = previous.items.filter((_, itemIndex) => itemIndex !== index);
			return { ...previous, items: nextItems };
		});
	}

	function resetForm() {
		setDraft(createInitialDraft());
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(null);
		setSuccessMessage(null);

		const payloadItems = derivedItems.map((item) => ({
			product: item.product,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			vatRate: item.vatRate,
			unitPricePerSquareMeter: item.unitPricePerSquareMeter,
			totalNet: item.totalNet,
			totalGross: item.totalGross,
		}));

		const payload: ManualOrderPayload = {
			reference: draft.reference.trim(),
			status: draft.status,
			channel: draft.channel,
			notes: draft.notes.trim(),
			currency: draft.currency.trim().toUpperCase() || 'PLN',
			billing: {
				name: draft.billing.name.trim(),
				street: draft.billing.street.trim(),
				postalCode: draft.billing.postalCode.trim(),
				city: draft.billing.city.trim(),
				phone: draft.billing.phone.trim(),
				email: draft.billing.email.trim(),
			},
			shipping: draft.shipping.sameAsBilling
				? { ...draft.billing, sameAsBilling: true }
				: {
					name: draft.shipping.name.trim(),
					street: draft.shipping.street.trim(),
					postalCode: draft.shipping.postalCode.trim(),
					city: draft.shipping.city.trim(),
					phone: draft.shipping.phone.trim(),
					email: draft.shipping.email.trim(),
					sameAsBilling: false,
				},
			items: payloadItems,
		};

		startTransition(async () => {
			try {
				const created = await createManualOrder(payload);
				setOrders((previous) => [created, ...previous]);
				setSelectedOrderId(created.id);
				setSuccessMessage(`Zamówienie ${created.reference} zostało dodane.`);
				resetForm();
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Nie udało się zapisać zamówienia.';
				setErrorMessage(message);
			}
		});
	}

	return (
		<div className="space-y-6">
				<div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_1fr]">
				<Card className="h-fit">
					<CardHeader>
						<CardTitle>Dodaj ręczne zamówienie</CardTitle>
						<CardDescription>
							Wypełnij dane klienta i pozycji, a zamówienie od razu trafi do bazy.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{errorMessage ? (
							<Alert variant="destructive">
								<AlertTitle>Nie udało się zapisać zamówienia</AlertTitle>
								<AlertDescription>{errorMessage}</AlertDescription>
							</Alert>
						) : null}
						{successMessage ? (
							<Alert>
								<AlertTitle>Gotowe</AlertTitle>
								<AlertDescription>{successMessage}</AlertDescription>
							</Alert>
						) : null}

						<form className="space-y-6" onSubmit={handleSubmit}>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="order-reference">Numer zamówienia</Label>
									<Input
										id="order-reference"
										placeholder="NP-2024-1"
										value={draft.reference}
										onChange={(event) =>
											setDraft((previous) => ({ ...previous, reference: event.target.value }))
										}
									required
								/>
								</div>
								<div className="space-y-2">
									<Label>Status</Label>
									<Select
										value={draft.status}
										onValueChange={(value) =>
											setDraft((previous) => ({ ...previous, status: value }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Wybierz status" />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Kanał sprzedaży</Label>
									<Select
										value={draft.channel}
										onValueChange={(value) =>
											setDraft((previous) => ({ ...previous, channel: value }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Wybierz kanał" />
										</SelectTrigger>
										<SelectContent>
											{channelOptions.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="order-currency">Waluta</Label>
									<Input
										id="order-currency"
										value={draft.currency}
										onChange={(event) =>
											setDraft((previous) => ({ ...previous, currency: event.target.value }))
										}
										maxLength={3}
										className="uppercase"
										required
								/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Dane rozliczeniowe</Label>
									<div className="grid gap-3">
										<Input
											placeholder="Imię i nazwisko"
											value={draft.billing.name}
											onChange={(event) => handleBillingChange('name', event.target.value)}
											required
										/>
										<Input
											placeholder="Ulica i numer"
											value={draft.billing.street}
											onChange={(event) => handleBillingChange('street', event.target.value)}
											required
										/>
										<div className="grid gap-3 md:grid-cols-[120px_1fr]">
											<Input
												placeholder="Kod pocztowy"
												value={draft.billing.postalCode}
												onChange={(event) => handleBillingChange('postalCode', event.target.value)}
												required
											/>
											<Input
												placeholder="Miasto"
												value={draft.billing.city}
												onChange={(event) => handleBillingChange('city', event.target.value)}
												required
											/>
										</div>
										<Input
											placeholder="Numer telefonu"
											value={draft.billing.phone}
											onChange={(event) => handleBillingChange('phone', event.target.value)}
											inputMode="numeric"
											pattern="[0-9]*"
											required
										/>
										<Input
											placeholder="E-mail"
											type="email"
											value={draft.billing.email}
											onChange={(event) => handleBillingChange('email', event.target.value)}
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Dane wysyłkowe</Label>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<span>Takie jak rozliczeniowe</span>
											<Switch
												checked={draft.shipping.sameAsBilling}
												onCheckedChange={handleShippingToggle}
											/>
										</div>
									</div>
									<div className="grid gap-3">
										<Input
											placeholder="Imię i nazwisko"
											value={draft.shipping.sameAsBilling ? draft.billing.name : draft.shipping.name}
											onChange={(event) => handleShippingChange('name', event.target.value)}
											disabled={draft.shipping.sameAsBilling}
											required={!draft.shipping.sameAsBilling}
										/>
										<Input
											placeholder="Ulica i numer"
											value={draft.shipping.sameAsBilling ? draft.billing.street : draft.shipping.street}
											onChange={(event) => handleShippingChange('street', event.target.value)}
											disabled={draft.shipping.sameAsBilling}
											required={!draft.shipping.sameAsBilling}
										/>
										<div className="grid gap-3 md:grid-cols-[120px_1fr]">
											<Input
												placeholder="Kod pocztowy"
												value={draft.shipping.sameAsBilling ? draft.billing.postalCode : draft.shipping.postalCode}
												onChange={(event) => handleShippingChange('postalCode', event.target.value)}
												disabled={draft.shipping.sameAsBilling}
												required={!draft.shipping.sameAsBilling}
											/>
											<Input
												placeholder="Miasto"
												value={draft.shipping.sameAsBilling ? draft.billing.city : draft.shipping.city}
												onChange={(event) => handleShippingChange('city', event.target.value)}
												disabled={draft.shipping.sameAsBilling}
												required={!draft.shipping.sameAsBilling}
											/>
										</div>
										<Input
											placeholder="Numer telefonu"
											value={draft.shipping.sameAsBilling ? draft.billing.phone : draft.shipping.phone}
											onChange={(event) => handleShippingChange('phone', event.target.value)}
											disabled={draft.shipping.sameAsBilling}
											required={!draft.shipping.sameAsBilling}
										/>
										<Input
											placeholder="E-mail"
											type="email"
											value={draft.shipping.sameAsBilling ? draft.billing.email : draft.shipping.email}
											onChange={(event) => handleShippingChange('email', event.target.value)}
											disabled={draft.shipping.sameAsBilling}
											required={!draft.shipping.sameAsBilling}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="order-notes">Notatki</Label>
										<Textarea
											id="order-notes"
											placeholder="np. numer listu przewozowego lub dodatkowe etapy"
											value={draft.notes}
											onChange={(event) =>
												setDraft((previous) => ({ ...previous, notes: event.target.value }))
											}
											rows={3}
										/>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>Pozycje zamówienia</Label>
									<Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
										Dodaj pozycję
									</Button>
								</div>
								<div className="space-y-4">
									{draft.items.map((item, index) => {
										const derived = derivedItems[index];
										return (
											<div key={index} className="rounded-lg border bg-muted/20 p-4">
												<div className="flex items-center justify-between gap-2">
													<span className="text-sm font-medium text-muted-foreground">
														Pozycja {index + 1}
													</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														disabled={draft.items.length === 1}
														onClick={() => handleRemoveItem(index)}
													>
														Usuń
													</Button>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-2">
													<div className="space-y-1">
														<Label className="text-xs uppercase text-muted-foreground">Nazwa produktu</Label>
														<Input
															placeholder="np. English oak"
															value={item.product}
															onChange={(event) => handleItemChange(index, 'product', event.target.value)}
															required
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs uppercase text-muted-foreground">Ile m² w op.</Label>
														<Input
															placeholder="np. 2.5"
															value={item.squareMetersPerPackage}
															onChange={(event) => handleItemChange(index, 'squareMetersPerPackage', event.target.value)}
															inputMode="decimal"
															min="0"
															step="0.001"
													/>
													</div>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-3">
													<div className="space-y-1">
														<Label className="text-xs uppercase text-muted-foreground">Ilość opakowań</Label>
														<Input
															placeholder="np. 1"
															value={item.quantity}
															onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
															type="number"
															min="0"
															step="0.001"
															required
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs uppercase text-muted-foreground">Cena netto za op.</Label>
														<Input
															placeholder="np. 120"
															value={item.unitPrice}
															onChange={(event) => handleItemChange(index, 'unitPrice', event.target.value)}
															type="number"
															min="0"
															step="0.01"
															required
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs uppercase text-muted-foreground">VAT %</Label>
														<Input
															placeholder="np. 23"
															value={item.vatRate}
															onChange={(event) => handleItemChange(index, 'vatRate', event.target.value)}
															type="number"
															min="0"
															step="0.1"
															required
														/>
													</div>
												</div>
												<div className="mt-4 grid gap-3 rounded-lg bg-background/70 p-4 shadow-sm md:grid-cols-3">
													<div>
														<p className="text-xs font-medium uppercase text-muted-foreground">Cena netto za m²</p>
														<p className="text-sm font-semibold">
															{formatCurrency(derived.unitPricePerSquareMeter || 0, draft.currency)}
														</p>
													</div>
													<div>
														<p className="text-xs font-medium uppercase text-muted-foreground">Cena brutto za op. (23% VAT)</p>
														<p className="text-sm font-semibold">
															{formatCurrency(derived.unitPriceGross, draft.currency)}
														</p>
													</div>
													<div>
														<p className="text-xs font-medium uppercase text-muted-foreground">Cena brutto łącznie</p>
														<p className="text-sm font-semibold">
															{formatCurrency(derived.totalGross, draft.currency)}
														</p>
													</div>
												</div>
												<div className="mt-4 grid gap-3 md:grid-cols-2">
													<div>
														<p className="text-xs font-medium uppercase text-muted-foreground">Wartość netto pozycji</p>
														<p className="text-base font-semibold">
															{formatCurrency(derived.totalNet, draft.currency)}
														</p>
													</div>
													<div>
														<p className="text-xs font-medium uppercase text-muted-foreground">Wartość brutto pozycji</p>
														<p className="text-base font-semibold">
															{formatCurrency(derived.totalGross, draft.currency)}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
								<div className="rounded-lg border bg-muted/40 p-4">
									<p className="text-sm text-muted-foreground">Podsumowanie zamówienia</p>
									<div className="mt-2 grid gap-2 md:grid-cols-2">
										<div>
											<p className="text-xs text-muted-foreground">Łącznie netto</p>
											<p className="text-base font-semibold">
												{formatCurrency(totals.net, draft.currency)}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Łącznie brutto</p>
											<p className="text-base font-semibold">
												{formatCurrency(totals.gross, draft.currency)}
											</p>
										</div>
									</div>
								</div>
							</div>

							<Button className="w-full" type="submit" disabled={isPending}>
								{isPending ? 'Zapisywanie...' : 'Zapisz zamówienie'}
							</Button>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Ostatnie zamówienia</CardTitle>
							<CardDescription>
								Przeglądaj ręcznie dodane zamówienia i wybierz jedno, aby zobaczyć szczegóły.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{orders.length ? (
								<ScrollArea className="max-h-[420px] pr-4">
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
														)}
														onClick={() => setSelectedOrderId(order.id)}
														onKeyDown={(event) => {
															if (event.key === 'Enter' || event.key === ' ') {
																event.preventDefault();
																setSelectedOrderId(order.id);
															}
														}}
														tabIndex={0}
														role="button"
												>
													<TableCell className="font-medium">{order.reference}</TableCell>
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
										<Button type="button" onClick={() => setSelectedOrderId(null)}>
											Odśwież widok
										</Button>
									</EmptyContent>
								</Empty>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Szczegóły zamówienia</CardTitle>
							<CardDescription>
								Zawiera pozycje, adresy oraz oś czasu postępu zamówienia.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{selectedOrder ? (
								<div className="space-y-6">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
										<div>
											<h3 className="text-xl font-semibold">{selectedOrder.reference}</h3>
											<p className="text-sm text-muted-foreground">
												Kanał: {selectedOrder.channel} • Utworzono: {formatDateTime(selectedOrder.createdAt)}
											</p>
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
															<p className="font-medium">{entry.title}</p>
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
										<EmptyDescription>Kliknij zamówienie z listy obok, aby zobaczyć wszystkie szczegóły.</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default OrdersClient;
