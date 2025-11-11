'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { ConfirmOrderButton } from './_components/confirm-order-button';
import type { Order } from './data';

const STATUS_FILTERS = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'review', label: 'Do potwierdzenia' },
  { value: 'confirmed', label: 'Potwierdzone' },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]['value'];

const SOURCE_FILTERS = [
  { value: 'all', label: 'Wszystkie kanały' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'manual', label: 'Ręczne' },
] as const;

type SourceFilterValue = (typeof SOURCE_FILTERS)[number]['value'];

function formatCurrency(amount: number, currency: string) {
  if (!Number.isFinite(amount)) {
    return '--';
  }

  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export type OrdersListClientProps = {
  initialOrders: Order[];
};

export function OrdersListClient({ initialOrders }: OrdersListClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [search, setSearch] = useState('');

  const normalizedQuery = search.trim().toLowerCase();

  const reviewCount = useMemo(
    () => initialOrders.filter((order) => order.requiresReview).length,
    [initialOrders],
  );

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (statusFilter === 'review' && !order.requiresReview) {
        return false;
      }

      if (statusFilter === 'confirmed' && order.requiresReview) {
        return false;
      }

      if (sourceFilter !== 'all' && order.source !== sourceFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [order.reference, order.customer, order.channel].join(' ').toLowerCase();
      return includesQuery(haystack, normalizedQuery);
    });
  }, [initialOrders, normalizedQuery, sourceFilter, statusFilter]);

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader className="space-y-6">
          <div>
            <CardTitle>Zamówienia</CardTitle>
            <CardDescription>Filtruj po statusie, źródle oraz wyszukaj numer lub klienta.</CardDescription>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">Wyszukaj</span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Szukaj numeru, klienta lub kanału"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">Status</span>
                <ToggleGroup
                  type="single"
                  value={statusFilter}
                  onValueChange={(value) => {
                    if (value) {
                      setStatusFilter(value as StatusFilterValue);
                    }
                  }}
                  className="w-full flex-wrap justify-start gap-2"
                  size="sm"
                >
                  {STATUS_FILTERS.map((filter) => (
                    <ToggleGroupItem
                      key={filter.value}
                      value={filter.value}
                      className="flex-1 min-w-[9rem] text-center"
                    >
                      {filter.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">Źródło</span>
                <ToggleGroup
                  type="single"
                  value={sourceFilter}
                  onValueChange={(value) => {
                    if (value) {
                      setSourceFilter(value as SourceFilterValue);
                    }
                  }}
                  className="w-full flex-wrap justify-start gap-2"
                  size="sm"
                >
                  {SOURCE_FILTERS.map((filter) => (
                    <ToggleGroupItem
                      key={filter.value}
                      value={filter.value}
                      className="flex-1 min-w-[9rem] text-center"
                    >
                      {filter.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <Card className="lg:order-1">
          <CardHeader>
            <CardTitle>Ostatnie zamówienia</CardTitle>
            <CardDescription>Lista zamówień z kanału WooCommerce oraz wprowadzonych ręcznie.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia>
                    <span className="text-2xl">🔍</span>
                  </EmptyMedia>
                  <EmptyTitle>Brak wyników</EmptyTitle>
                  <EmptyDescription>Spróbuj zmienić filtry lub wyszukiwaną frazę.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="hidden max-h-[600px] overflow-x-auto overflow-y-auto lg:block">
                  <Table className="min-w-[960px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numer</TableHead>
                        <TableHead>Klient</TableHead>
                        <TableHead>Kanał</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Źródło</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Kwota brutto</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="align-top">
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {order.reference}
                            </Link>
                            {order.requiresReview ? (
                              <div className="mt-1">
                                <Badge variant="destructive">Do potwierdzenia</Badge>
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{order.customer}</span>
                              <span className="text-xs text-muted-foreground">{order.billing.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{order.channel}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {order.source === 'woocommerce' ? (
                              <Badge variant="outline">WooCommerce</Badge>
                            ) : (
                              <Badge variant="secondary">Ręczne</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.totals.totalGross, order.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {order.requiresReview ? <ConfirmOrderButton orderId={order.id} /> : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-4 lg:hidden">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="space-y-3 rounded-lg border bg-background p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-base font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {order.reference}
                          </Link>
                          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline">{order.status}</Badge>
                          {order.requiresReview ? <Badge variant="destructive">Do potwierdzenia</Badge> : null}
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Klient</p>
                          <p className="font-medium text-foreground">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.billing.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{order.channel}</Badge>
                          <Badge variant="secondary">
                            {order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Kwota brutto</p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(order.totals.totalGross, order.currency)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Szczegóły zamówienia
                            </Link>
                            {order.requiresReview ? <ConfirmOrderButton orderId={order.id} /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:order-2">
          <CardHeader>
            <CardTitle>Podsumowanie kanałów</CardTitle>
            <CardDescription>Szybki stan zamówień do potwierdzenia oraz według źródeł.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Łącznie</p>
                <p className="text-2xl font-semibold">{initialOrders.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Do potwierdzenia</p>
                <p className="text-2xl font-semibold">{reviewCount}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">WooCommerce</p>
                <p className="text-2xl font-semibold">
                  {initialOrders.filter((order) => order.source === 'woocommerce').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
