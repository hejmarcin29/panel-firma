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
import { OrderAttachments } from '../_components/order-attachments';
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
		<section className="space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<Link
					href="/dashboard/orders"
					className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Powrót
				</Link>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 px-3 text-xs"
					>
						<Link href={`/dashboard/orders/${order.id}/print`}>Drukuj</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 px-3 text-xs"
					>
						<Link href={`mailto:${order.billing.email}`}>Wyślij e-mail</Link>
					</Button>
				</div>
			</div>

			<div className="rounded-lg border bg-background p-4 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-2xl font-semibold leading-tight tracking-tight">{order.reference}</h1>
							<Badge variant="secondary" className="px-2 py-0 text-[11px]">
								{order.status}
							</Badge>
						</div>
						<p className="max-w-xl text-xs text-muted-foreground">
							Kanał: <span className="font-medium text-foreground">{order.channel}</span> • Źródło:{' '}
							<span className="font-medium text-foreground">
								{order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
							</span>{' '}
							• Utworzone: <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
						</p>
						{currentStatus ? (
							<p className="text-[11px] text-muted-foreground">
								Aktualny krok: <span className="font-medium text-foreground">{currentStatus.title}</span>
							</p>
						) : null}
					</div>
					<div className="flex flex-col gap-2 text-right">
						<div className="grid grid-cols-3 gap-2 text-left sm:text-right">
							<div className="space-y-1">
								<p className="text-[10px] uppercase text-muted-foreground">Suma brutto</p>
								<p className="text-sm font-semibold text-foreground">
									{formatCurrency(order.totals.totalGross, order.currency)}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] uppercase text-muted-foreground">Łącznie m²</p>
								<p className="text-sm font-semibold text-foreground">{formatNumber(totalSquareMeters)}</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] uppercase text-muted-foreground">Postęp</p>
								<p className="text-sm font-semibold text-foreground">
									{completedSteps}/{statusesWithTasks.length}
								</p>
							</div>
						</div>
						{order.requiresReview ? (
							<ConfirmOrderButton orderId={order.id} className="h-8 px-3 text-xs" />
						) : null}
					</div>
				</div>
				{order.customerNote ? (
					<div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3">
						<p className="text-[10px] font-semibold uppercase text-primary">Dodatkowe informacje od klienta</p>
						<p className="mt-2 whitespace-pre-line text-xs text-foreground">{order.customerNote}</p>
					</div>
				) : null}
				<Separator className="my-3" />
				<div className="grid gap-2 min-[360px]:grid-cols-2 lg:grid-cols-4">
					<QuickStat label="Klient" value={order.billing.name} />
					<QuickStat label="Miasto dostawy" value={deliveryCity} />
					<QuickStat label="Telefon" value={order.billing.phone} icon={Phone} />
					<QuickStat label="E-mail" value={order.billing.email} icon={Mail} />
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
				<div className="space-y-4">
					<Card className="rounded-lg">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Pozycje zamówienia</CardTitle>
							<CardDescription className="text-xs">
								Szczegółowe informacje o produktach i metrach kwadratowych.
							</CardDescription>
						</CardHeader>
						<CardContent className="px-4 pb-4 pt-0">
							<div className="space-y-2 md:hidden">
								{order.items.map((item) => (
									<OrderItemCard key={item.id} item={item} currency={order.currency} />
								))}
							</div>
							<div className="hidden overflow-x-auto md:block">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="py-2 text-[11px]">Produkt</TableHead>
											<TableHead className="py-2 text-[11px]">Ilość</TableHead>
											<TableHead className="py-2 text-[11px]">M² w op.</TableHead>
											<TableHead className="py-2 text-[11px]">M² łącznie</TableHead>
											<TableHead className="py-2 text-[11px]">VAT</TableHead>
											<TableHead className="py-2 text-[11px]">Cena netto</TableHead>
											<TableHead className="py-2 text-right text-[11px]">Kwota brutto</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{order.items.map((item) => {
											const perPackageArea = computePackageArea(item);
											const totalArea = computeTotalArea(item);

											return (
												<TableRow key={item.id}>
													<TableCell className="py-2 text-xs font-medium">{item.product}</TableCell>
													<TableCell className="py-2 text-xs">{formatNumber(item.quantity)}</TableCell>
													<TableCell className="py-2 text-xs">{formatNumber(perPackageArea)}</TableCell>
													<TableCell className="py-2 text-xs">{formatNumber(totalArea)}</TableCell>
													<TableCell className="py-2 text-xs">{item.vatRate}%</TableCell>
													<TableCell className="py-2 text-xs">
														{formatCurrency(item.unitPrice, order.currency)}
													</TableCell>
													<TableCell className="py-2 text-right text-xs font-semibold">
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

					<Card className="rounded-lg">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Historia statusów</CardTitle>
							<CardDescription className="text-xs">Śledź przebieg realizacji zamówienia.</CardDescription>
						</CardHeader>
						<CardContent className="px-4 pb-4 pt-0">
							<OrderStatusTimeline
								orderId={order.id}
								entries={statusesWithTasks}
								currentStatus={order.status}
							/>
						</CardContent>
					</Card>

					<Card className="rounded-lg">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Dokumenty</CardTitle>
							<CardDescription className="text-xs">Lista proform i faktur powiązanych z zamówieniem.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 px-4 pb-4 pt-0">
							<div>
								{documents.length === 0 ? (
									<p className="text-xs text-muted-foreground">Brak wystawionych dokumentów.</p>
								) : (
									<>
										<div className="space-y-3 md:hidden">
											{documents.map((document) => (
												<DocumentCard key={document.id} document={document} />
											))}
										</div>
										<div className="hidden overflow-x-auto md:block">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="py-2 text-[11px]">Typ</TableHead>
														<TableHead className="py-2 text-[11px]">Numer</TableHead>
														<TableHead className="py-2 text-[11px]">Status</TableHead>
														<TableHead className="py-2 text-[11px]">Data</TableHead>
														<TableHead className="py-2 text-right text-[11px]">Akcje</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{documents.map((document) => (
														<TableRow key={document.id}>
															<TableCell className="py-2 text-xs font-medium capitalize">{document.type}</TableCell>
															<TableCell className="py-2 text-xs">{document.number ?? '—'}</TableCell>
															<TableCell className="py-2 text-xs">
																<Badge variant="outline" className="px-2 py-0 text-[10px]">
																	{document.status}
																</Badge>
															</TableCell>
															<TableCell className="py-2 text-xs">
																{document.issueDate ? formatDate(document.issueDate) : '—'}
															</TableCell>
															<TableCell className="py-2 text-right text-xs">
																{document.pdfUrl ? (
																	<Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
																		<Link href={document.pdfUrl} target="_blank" rel="noreferrer">
																			Pobierz PDF
																		</Link>
																</Button>
																) : (
																	<span className="text-[10px] text-muted-foreground">Brak pliku</span>
																)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</>
								)}
							</div>
							<Separator className="my-1" />
							<OrderAttachments orderId={order.id} customerName={order.billing.name} attachments={order.attachments} />
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card className="rounded-lg">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Dane rozliczeniowe</CardTitle>
							<CardDescription className="text-xs">Informacje niezbędne do faktury.</CardDescription>
						</CardHeader>
						<CardContent className="px-4 pb-4 pt-0">
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

					<Card className="rounded-lg">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Dostawa</CardTitle>
							<CardDescription className="text-xs">Kontakt dla kuriera i adres wysyłki.</CardDescription>
						</CardHeader>
						<CardContent className="px-4 pb-4 pt-0">
							{order.shipping.sameAsBilling ? (
								<p className="text-xs text-muted-foreground">Dane identyczne jak do faktury.</p>
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

					<Card className="rounded-lg lg:sticky lg:top-4">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">Szybkie akcje</CardTitle>
							<CardDescription className="text-xs">Najczęściej wykonywane operacje.</CardDescription>
						</CardHeader>
						<CardContent className="px-4 pb-4 pt-0">
							<div className="grid grid-cols-2 gap-2">
								<Button variant="outline" asChild className="h-8 px-3 text-xs">
									<Link href={`tel:${order.billing.phone}`}>Zadzwoń</Link>
								</Button>
								<Button variant="outline" asChild className="h-8 px-3 text-xs">
									<Link href={`mailto:${order.billing.email}`}>E-mail</Link>
								</Button>
								<Button variant="ghost" className="h-8 justify-center px-3 text-xs" asChild>
									<Link href={`/dashboard/orders/${order.id}/notes`}>Notatka</Link>
								</Button>
								<Button variant="ghost" className="h-8 justify-center px-3 text-xs" asChild>
									<Link href={`/dashboard/orders/${order.id}/print`}>Drukuj</Link>
								</Button>
							</div>
							<Separator className="my-3" />
							<div className="space-y-2">
								<OrderStatusForm orderId={order.id} currentStatus={order.status} />
							</div>
							<IssueProformaButton
								orderId={order.id}
								isWfirmaConfigured={hasWfirmaIntegration}
								className="h-8 w-full px-3 text-xs"
							/>
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
		<div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
			<div className="flex flex-col gap-0.5">
				<p className="text-[13px] font-semibold leading-tight text-foreground">{item.product}</p>
				<span className="text-[10px] text-muted-foreground">VAT {item.vatRate}%</span>
			</div>
			<dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
				<div className="space-y-0.5">
					<dt className="text-muted-foreground">Ilość</dt>
					<dd className="text-xs font-semibold text-foreground">{formatNumber(item.quantity)}</dd>
				</div>
				<div className="space-y-0.5">
					<dt className="text-muted-foreground">M² w op.</dt>
					<dd className="text-xs font-semibold text-foreground">{formatNumber(perPackageArea)}</dd>
				</div>
				<div className="space-y-0.5">
					<dt className="text-muted-foreground">M² łącznie</dt>
					<dd className="text-xs font-semibold text-foreground">{formatNumber(totalArea)}</dd>
				</div>
				<div className="space-y-0.5">
					<dt className="text-muted-foreground">Cena netto</dt>
					<dd className="text-xs font-semibold text-foreground">{formatCurrency(item.unitPrice, currency)}</dd>
				</div>
				<div className="col-span-2 space-y-0.5">
					<dt className="text-muted-foreground">Kwota brutto</dt>
					<dd className="text-[13px] font-semibold text-foreground">{formatCurrency(item.totalGross, currency)}</dd>
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
		<div className="rounded-lg border bg-muted/40 p-3">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium capitalize text-foreground">{document.type}</p>
				<Badge variant="outline" className="px-2 py-0 text-[10px]">
					{document.status}
				</Badge>
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
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
					<Button asChild size="sm" variant="outline" className="h-8 w-full px-3 text-xs">
						<Link href={document.pdfUrl} target="_blank" rel="noreferrer">
							Pobierz PDF
						</Link>
					</Button>
				) : (
					<span className="text-[10px] text-muted-foreground">Brak pliku</span>
				)}
			</div>
		</div>
	);
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
	return (
		<div className="rounded-lg border bg-muted/30 p-3">
			<p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
			<div className="mt-1 flex items-center gap-2 text-xs font-medium text-foreground">
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
		<div className="space-y-2">
			<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
				{Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
				<span>{title}</span>
			</div>
			<div className="space-y-1 text-xs text-muted-foreground">
				<p className="font-medium text-foreground">{name}</p>
				<p>{street}</p>
				<p>{city}</p>
				<p>{phone}</p>
				<p>{email}</p>
			</div>
		</div>
	);
}
