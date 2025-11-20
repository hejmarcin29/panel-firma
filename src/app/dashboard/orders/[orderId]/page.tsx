import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Warehouse, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { tryGetWfirmaConfig } from '@/lib/wfirma/config';

import { getManualOrderById, getOrderDocuments } from '../actions';
import { ConfirmOrderButton } from '../_components/confirm-order-button';
import { IssueProformaButton } from '../_components/issue-proforma-button';
import { OrderStatusForm } from '../_components/order-status-form';
import { OrderStatusTimeline } from '../_components/order-status-timeline';
import type { Order, OrderTimelineEntry, OrderDocument, OrderTaskOverrides } from '../data';
import { statusOptions } from '../utils';

type OrderDetailsPageParams = {
	params: Promise<{
		orderId: string;
	}>;
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

function computeOrderSquareMeters(order: Order) {
	return order.items.reduce((sum, item) => {
		const total = computeTotalArea(item);
		return sum + (total ?? 0);
	}, 0);
}

const statusIndexMap = statusOptions.reduce<Record<string, number>>((acc, status, index) => {
	acc[status] = index;
	return acc;
}, {});

function enhanceTimelineEntries(
	entries: OrderTimelineEntry[],
	documents: OrderDocument[],
	currentStatus: string,
	taskOverrides: OrderTaskOverrides,
): OrderTimelineEntry[] {
	const currentStageIndex = statusIndexMap[currentStatus] ?? 0;

	return entries.map((entry) => {
		if (!entry.statusKey) {
			return entry;
		}

		const enhancedTasks = entry.tasks.map((task) => {
			const autoCompleted = computeTaskCompletion(
				entry.statusKey as string,
				task.label,
				entry.state,
				documents,
				currentStageIndex,
			);
			const hasManualOverride = Object.prototype.hasOwnProperty.call(taskOverrides, task.id);
			const manualOverride = hasManualOverride ? taskOverrides[task.id] : null;
			const completed = hasManualOverride ? (manualOverride as boolean) : autoCompleted;
			const completionSource: 'auto' | 'manual' = hasManualOverride ? 'manual' : 'auto';

			return {
				...task,
				completed,
				autoCompleted,
				manualOverride: hasManualOverride ? (manualOverride as boolean) : null,
				completionSource,
			};
		});

		return {
			...entry,
			tasks: enhancedTasks,
		};
	});
}

function computeTaskCompletion(
	statusKey: string,
	taskLabel: string,
	state: OrderTimelineEntry['state'],
	documents: OrderDocument[],
	currentStageIndex: number,
): boolean {
	const normalizedStatus = statusKey.toLowerCase();
	const normalizedTask = taskLabel.toLowerCase();

	const hasDocument = (type: string) =>
		documents.some((document) => document.type === type && document.status !== 'cancelled');

	const hasDocumentPdf = (type: string) =>
		documents.some((document) => document.type === type && Boolean(document.pdfUrl));

	if (normalizedStatus === 'weryfikacja i płatność') {
		if (
			normalizedTask.includes('proforma') &&
			normalizedTask.includes('wystaw') &&
			normalizedTask.includes('wysł')
		) {
			return hasDocument('proforma') && hasDocumentPdf('proforma');
		}
		if (normalizedTask.includes('proforma') && normalizedTask.includes('opłac')) {
			return state === 'completed';
		}
	}

	if (normalizedStatus === 'kompletacja zamówienia') {
		if (normalizedTask.includes('wysłane')) {
			const shippingStageIndex = statusIndexMap['Wydanie przewoźnikowi'];
			return typeof shippingStageIndex === 'number' ? currentStageIndex >= shippingStageIndex : state === 'completed';
		}
	}

	if (normalizedStatus === 'dostarczone do klienta') {
		if (normalizedTask.includes('faktur') && normalizedTask.includes('końcową')) {
			return hasDocument('final_invoice');
		}
	}

	return state === 'completed';
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageParams) {
	const { orderId } = await params;

	await requireUser();

	const orderData = await getManualOrderById(orderId);

	if (!orderData) {
		notFound();
	}

	const order: Order = orderData;
	const documents = await getOrderDocuments(order.id);
	const wfirmaConfig = await tryGetWfirmaConfig();
	const hasWfirmaIntegration = Boolean(wfirmaConfig);
	const totalSquareMeters = computeOrderSquareMeters(order);
	const statusesWithTasks = enhanceTimelineEntries(
		order.statuses,
		documents,
		order.status,
		order.taskOverrides ?? {},
	);
	const completedSteps = statusesWithTasks.filter((status) => status.state === 'completed').length;
	const currentStatus = statusesWithTasks.find((status) => status.state === 'current');

	const deliveryCity = order.shipping.sameAsBilling ? order.billing.city : order.shipping.city;

	return (
		<section className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Link
					href="/dashboard/orders"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Powrót
				</Link>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
						<Link href={`/dashboard/orders/${order.id}/print`}>Drukuj</Link>
					</Button>
					<Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
						<Link href={`mailto:${order.billing.email}`}>Wyślij e-mail</Link>
					</Button>
				</div>
			</div>

			<div className="rounded-2xl border bg-background p-6 shadow-sm">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-semibold tracking-tight">{order.reference}</h1>
							<Badge variant="secondary">{order.status}</Badge>
						</div>
						<p className="max-w-xl text-sm text-muted-foreground">
							Kanał: <span className="font-medium text-foreground">{order.channel}</span> • Źródło: {' '}
							<span className="font-medium text-foreground">
								{order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
							</span>{' '}
							• Utworzone: <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
						</p>
						{currentStatus ? (
							<p className="text-xs text-muted-foreground">
								Aktualny krok: <span className="font-medium text-foreground">{currentStatus.title}</span>
							</p>
						) : null}
					</div>
					<div className="flex flex-col gap-3 lg:items-end">
						<div className="flex flex-wrap gap-3 text-left lg:justify-end lg:text-right">
							<div>
								<p className="text-xs uppercase text-muted-foreground">Suma brutto</p>
								<p className="text-lg font-semibold text-foreground">
									{formatCurrency(order.totals.totalGross, order.currency)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Łącznie m²</p>
								<p className="text-lg font-semibold text-foreground">{formatNumber(totalSquareMeters)}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Postęp</p>
								<p className="text-lg font-semibold text-foreground">
									{completedSteps}/{statusesWithTasks.length}
								</p>
							</div>
						</div>
						{order.requiresReview ? <ConfirmOrderButton orderId={order.id} /> : null}
					</div>
				</div>
				<Separator className="my-6" />
				<div className="grid gap-4 min-[360px]:grid-cols-2 lg:grid-cols-4">
					<QuickStat label="Klient" value={order.billing.name} />
					<QuickStat label="Miasto dostawy" value={deliveryCity} />
					<QuickStat label="Telefon" value={order.billing.phone} icon={Phone} />
					<QuickStat label="E-mail" value={order.billing.email} icon={Mail} />
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Pozycje zamówienia</CardTitle>
							<CardDescription>Szczegółowe informacje o produktach i metrach kwadratowych.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4 md:hidden">
								{order.items.map((item) => (
									<OrderItemCard key={item.id} item={item} currency={order.currency} />
								))}
							</div>
							<div className="hidden overflow-x-auto md:block">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Produkt</TableHead>
											<TableHead>Ilość</TableHead>
											<TableHead>M² w op.</TableHead>
											<TableHead>M² łącznie</TableHead>
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
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Historia statusów</CardTitle>
							<CardDescription>Śledź przebieg realizacji zamówienia.</CardDescription>
						</CardHeader>
						<CardContent>
							<OrderStatusTimeline
								orderId={order.id}
								entries={statusesWithTasks}
								currentStatus={order.status}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dokumenty</CardTitle>
							<CardDescription>Lista proform i faktur powiązanych z zamówieniem.</CardDescription>
						</CardHeader>
						<CardContent>
							{documents.length === 0 ? (
								<p className="text-sm text-muted-foreground">Brak wystawionych dokumentów.</p>
							) : (
								<>
									<div className="space-y-4 md:hidden">
										{documents.map((document) => (
											<DocumentCard key={document.id} document={document} />
										))}
									</div>
									<div className="hidden overflow-x-auto md:block">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Typ</TableHead>
													<TableHead>Numer</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Data</TableHead>
													<TableHead className="text-right">Akcje</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{documents.map((document) => (
													<TableRow key={document.id}>
														<TableCell className="font-medium capitalize">{document.type}</TableCell>
														<TableCell>{document.number ?? '—'}</TableCell>
														<TableCell>
															<Badge variant="outline">{document.status}</Badge>
														</TableCell>
														<TableCell>
															{document.issueDate ? formatDate(document.issueDate) : '—'}
														</TableCell>
														<TableCell className="text-right">
															{document.pdfUrl ? (
																<Button asChild size="sm" variant="outline">
																	<Link href={document.pdfUrl} target="_blank" rel="noreferrer">
																		Pobierz PDF
																	</Link>
																</Button>
															) : (
																<span className="text-xs text-muted-foreground">Brak pliku</span>
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Dane rozliczeniowe</CardTitle>
							<CardDescription>Informacje niezbędne do faktury.</CardDescription>
						</CardHeader>
						<CardContent>
							<AddressBlock
								title="Faktura"
								name={order.billing.name}
								street={order.billing.street}
								city={`${order.billing.postalCode} ${order.billing.city}`}
								email={order.billing.email}
								phone={order.billing.phone}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dostawa</CardTitle>
							<CardDescription>Kontakt dla kuriera i adres wysyłki.</CardDescription>
						</CardHeader>
						<CardContent>
							{order.shipping.sameAsBilling ? (
								<p className="text-sm text-muted-foreground">Dane identyczne jak do faktury.</p>
							) : (
								<AddressBlock
									title="Adres wysyłki"
									name={order.shipping.name}
									street={order.shipping.street}
									city={`${order.shipping.postalCode} ${order.shipping.city}`}
									email={order.shipping.email}
									phone={order.shipping.phone}
									icon={Warehouse}
								/>
							)}
						</CardContent>
					</Card>

					<Card className="lg:sticky lg:top-6">
						<CardHeader>
							<CardTitle>Szybkie akcje</CardTitle>
							<CardDescription>Najczęściej wykonywane operacje.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<Button variant="outline" asChild>
								<Link href={`tel:${order.billing.phone}`}>Zadzwoń do klienta</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href={`mailto:${order.billing.email}`}>Wyślij e-mail</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href={`/dashboard/orders/${order.id}/notes`}>Dodaj notatkę</Link>
							</Button>
							<Separator className="my-2" />
							<OrderStatusForm orderId={order.id} currentStatus={order.status} />
							<IssueProformaButton orderId={order.id} isWfirmaConfigured={hasWfirmaIntegration} className="w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

type OrderItemCardProps = {
	item: Order['items'][number];
	currency: string;
};

function OrderItemCard({ item, currency }: OrderItemCardProps) {
	const perPackageArea = computePackageArea(item);
	const totalArea = computeTotalArea(item);

	return (
		<div className="rounded-xl border bg-muted/40 p-4">
			<div className="flex flex-col gap-1">
				<p className="text-sm font-medium text-foreground">{item.product}</p>
				<span className="text-xs text-muted-foreground">VAT {item.vatRate}%</span>
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
				<div className="space-y-1">
					<dt className="text-muted-foreground">Ilość</dt>
					<dd className="font-semibold text-foreground">{formatNumber(item.quantity)}</dd>
				</div>
				<div className="space-y-1">
					<dt className="text-muted-foreground">M² w op.</dt>
					<dd className="font-semibold text-foreground">{formatNumber(perPackageArea)}</dd>
				</div>
				<div className="space-y-1">
					<dt className="text-muted-foreground">M² łącznie</dt>
					<dd className="font-semibold text-foreground">{formatNumber(totalArea)}</dd>
				</div>
				<div className="space-y-1">
					<dt className="text-muted-foreground">Cena netto</dt>
					<dd className="font-semibold text-foreground">{formatCurrency(item.unitPrice, currency)}</dd>
				</div>
				<div className="col-span-2 space-y-1">
					<dt className="text-muted-foreground">Kwota brutto</dt>
					<dd className="text-base font-semibold text-foreground">{formatCurrency(item.totalGross, currency)}</dd>
				</div>
			</dl>
		</div>
	);
}

type DocumentCardProps = {
	document: OrderDocument;
};

function DocumentCard({ document }: DocumentCardProps) {
	return (
		<div className="rounded-xl border bg-muted/40 p-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium capitalize text-foreground">{document.type}</p>
				<Badge variant="outline">{document.status}</Badge>
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
				<div className="space-y-1">
					<dt className="text-muted-foreground">Numer</dt>
					<dd className="font-semibold text-foreground">{document.number ?? '—'}</dd>
				</div>
				<div className="space-y-1">
					<dt className="text-muted-foreground">Data</dt>
					<dd className="font-semibold text-foreground">
						{document.issueDate ? formatDate(document.issueDate) : '—'}
					</dd>
				</div>
			</dl>
			<div className="mt-3">
				{document.pdfUrl ? (
					<Button asChild size="sm" variant="outline" className="w-full">
						<Link href={document.pdfUrl} target="_blank" rel="noreferrer">
							Pobierz PDF
						</Link>
					</Button>
				) : (
					<span className="text-xs text-muted-foreground">Brak pliku</span>
				)}
			</div>
		</div>
	);
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
	return (
		<div className="rounded-xl border bg-muted/40 p-4">
			<p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
			<div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
				{Icon ? <Icon className="h-4 w-4" /> : null}
				<span className="truncate">{value}</span>
			</div>
		</div>
	);
}

type AddressBlockProps = {
	title: string;
	name: string;
	street: string;
	city: string;
	phone: string;
	email: string;
	icon?: LucideIcon;
};

function AddressBlock({ title, name, street, city, phone, email, icon: Icon }: AddressBlockProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
				{Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
				<span>{title}</span>
			</div>
			<div className="space-y-1 text-sm text-muted-foreground">
				<p className="font-medium text-foreground">{name}</p>
				<p>{street}</p>
				<p>{city}</p>
				<p>{phone}</p>
				<p>{email}</p>
			</div>
		</div>
	);
}
