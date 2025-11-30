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
import { OrderCard } from './_components/order-card';
import { OrderStatusBadge } from './_components/order-status-badge';
import type { Order } from './data';
import { Edit, Mail } from 'lucide-react';

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
        <div className="flex items-center justify-between px-4 md:px-0">
          <TabsList>
            <TabsTrigger value="all">Wszystkie</TabsTrigger>
            <TabsTrigger value="active">Aktywne</TabsTrigger>
            <TabsTrigger value="completed">Zakończone</TabsTrigger>
          </TabsList>
        </div>

        <div className="my-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 md:px-0">
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
      <div className="grid gap-4 md:hidden px-4 md:px-0">
        {orders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
          />
        ))}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[250px]">Numer / Źródło</TableHead>
              <TableHead className="w-[250px]">Klient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead className="text-right w-[100px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <Link 
                      href={`/dashboard/orders/${order.id}`}
                      className="hover:underline text-primary font-semibold text-base"
                    >
                      {order.reference}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      {order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{order.customer}</span>
                    <span className="text-xs text-muted-foreground">{order.billing.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {order.requiresReview && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-auto">Weryfikacja</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(order.createdAt)}
                </TableCell>
                <TableCell className="text-right font-bold text-base">
                  {formatCurrency(order.totals.totalGross, order.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {order.requiresReview && (
                      <ConfirmOrderButton orderId={order.id} />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Więcej opcji</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Szczegóły
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <FileText className="mr-2 h-4 w-4" />
                          Pobierz proformę
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Mail className="mr-2 h-4 w-4" />
                          Wyślij wiadomość
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
