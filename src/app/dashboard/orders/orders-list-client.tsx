'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  FileText, 
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ConfirmOrderButton } from './_components/confirm-order-button';
import { OrdersStats } from './_components/orders-stats';
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'order.received':
      return <Badge variant="destructive" className="animate-pulse">PILNE</Badge>;
    case 'order.pending_proforma':
      return <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">Oczekuje na proformę</Badge>;
    case 'order.proforma_issued':
      return <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50">Proforma wysłana</Badge>;
    case 'order.awaiting_payment':
      return <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">Oczekuje na płatność</Badge>;
    case 'order.paid':
      return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Opłacone</Badge>;
    case 'order.advance_invoice':
      return <Badge variant="outline" className="border-purple-200 text-purple-800 bg-purple-50">Faktura zaliczkowa</Badge>;
    case 'order.forwarded_to_supplier':
      return <Badge variant="outline" className="border-indigo-200 text-indigo-800 bg-indigo-50">Wysłane do dostawcy</Badge>;
    case 'order.fulfillment_confirmed':
      return <Badge variant="secondary" className="bg-teal-100 text-teal-800 hover:bg-teal-100">Potwierdzone</Badge>;
    case 'order.final_invoice':
      return <Badge variant="outline" className="border-pink-200 text-pink-800 bg-pink-50">Faktura końcowa</Badge>;
    case 'order.closed':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Zakończone</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export type OrdersListClientProps = {
  initialOrders: Order[];
};

export function OrdersListClient({ initialOrders }: OrdersListClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    initialOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [initialOrders]);

  const ordersFilteredByDate = useMemo(() => {
    if (selectedMonth === 'all') return initialOrders;
    return initialOrders.filter(order => {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [initialOrders, selectedMonth]);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    
    return ordersFilteredByDate.filter((order) => {
      // Tab filtering
      if (activeTab === 'active') {
        if (order.status === 'order.closed' || order.status === 'cancelled') return false;
      } else if (activeTab === 'completed') {
        if (order.status !== 'order.closed') return false;
      }

      // Existing filters
      if (statusFilter === 'review' && !order.requiresReview) return false;
      if (statusFilter === 'confirmed' && order.requiresReview) return false;
      if (sourceFilter !== 'all' && order.source !== sourceFilter) return false;

      if (!query) return true;

      return (
        includesQuery(order.reference, query) ||
        includesQuery(order.customer, query) ||
        includesQuery(order.billing.email, query) ||
        includesQuery(order.billing.phone, query)
      );
    });
  }, [ordersFilteredByDate, statusFilter, sourceFilter, search, activeTab]);

  return (
    <div className="flex flex-col gap-6 p-0 md:p-6">
      <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zamówienia</h1>
          <p className="text-muted-foreground">
            Zarządzaj zamówieniami i śledź ich status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz miesiąc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie miesiące</SelectItem>
              {availableMonths.map((month) => {
                const [year, monthNum] = month.split('-');
                const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                const label = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(date);
                return (
                  <SelectItem key={month} value={month} className="capitalize">
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nowe zamówienie
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col gap-4 p-4 md:hidden">
         <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Zamówienia</h1>
            <Button asChild size="sm">
               <Link href="/dashboard/orders/new">
                  <Plus className="h-4 w-4" />
               </Link>
            </Button>
         </div>
         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full">
               <SelectValue placeholder="Wybierz miesiąc" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Wszystkie miesiące</SelectItem>
               {availableMonths.map((month) => {
                  const [year, monthNum] = month.split('-');
                  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                  const label = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(date);
                  return (
                     <SelectItem key={month} value={month} className="capitalize">
                        {label}
                     </SelectItem>
                  );
               })}
            </SelectContent>
         </Select>
      </div>

      <OrdersStats orders={ordersFilteredByDate} />

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Wszystkie</TabsTrigger>
            <TabsTrigger value="active">Aktywne</TabsTrigger>
            <TabsTrigger value="completed">Zakończone</TabsTrigger>
          </TabsList>
        </div>

        <div className="my-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj zamówienia..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filtruj według źródła</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SOURCE_FILTERS.map((filter) => (
                  <DropdownMenuItem 
                    key={filter.value}
                    onClick={() => setSourceFilter(filter.value)}
                    className={sourceFilter === filter.value ? "bg-accent" : ""}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Status weryfikacji</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_FILTERS.map((filter) => (
                  <DropdownMenuItem 
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={statusFilter === filter.value ? "bg-accent" : ""}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <OrdersTable orders={filteredOrders} />
        </TabsContent>
        <TabsContent value="active" className="mt-0">
          <OrdersTable orders={filteredOrders} />
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
          <OrdersTable orders={filteredOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <FileText className="h-12 w-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Brak zamówień</EmptyTitle>
            <EmptyDescription>
              Nie znaleziono zamówień spełniających kryteria wyszukiwania.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Link 
                    href={`/dashboard/orders/${order.id}`}
                    className="font-semibold hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <span className="text-xs text-muted-foreground capitalize">
                    {order.source}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(order.status)}
                  {order.requiresReview && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-auto">Weryfikacja</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Klient</span>
                  <span className="font-medium">{order.customer}</span>
                  <span className="text-xs text-muted-foreground truncate">{order.billing.email}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-xs text-muted-foreground">Kwota</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(order.totals.totalGross, order.currency)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span>{formatDateTime(order.createdAt)}</span>
                <div className="flex gap-2">
                  {order.requiresReview && (
                    <ConfirmOrderButton orderId={order.id} />
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      Szczegóły
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numer</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <Link 
                      href={`/dashboard/orders/${order.id}`}
                      className="hover:underline text-primary font-semibold"
                    >
                      {order.reference}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize">
                      {order.source}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.customer}</span>
                    <span className="text-xs text-muted-foreground">{order.billing.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                  {order.requiresReview && (
                    <Badge variant="destructive" className="ml-2">Weryfikacja</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.totals.totalGross, order.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {order.requiresReview && (
                      <ConfirmOrderButton orderId={order.id} />
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Szczegóły</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
