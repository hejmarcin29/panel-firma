'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  FileText,
  LayoutGrid,
  List,
  Edit, 
  Mail
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { OrderStatusBadge } from './_components/order-status-badge';
import { OrdersBoard } from './_components/orders-board';
import { ACTIVE_STATUS_IDS, ARCHIVED_STATUS_IDS, type OrderStatus } from './utils';
import type { Order } from './data';

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
  initialTab?: string;
};

export function OrdersListClient({ initialOrders, initialTab = 'board' }: OrdersListClientProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [search, setSearch] = useState('');
  // We use 'board', 'list', 'archive' as main tabs
  const [activeTab, setActiveTab] = useState<string>(initialTab === 'all' ? 'board' : initialTab);
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
    // First, filter by date (month)
    let byDate = initialOrders;
    if (selectedMonth !== 'all') {
      byDate = initialOrders.filter(order => {
        const date = new Date(order.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }
    
    // Then apply Search and Source filters globally
    const query = search.toLowerCase().trim();
    return byDate.filter((order) => {
       if (sourceFilter !== 'all' && order.source !== sourceFilter) return false;
       if (!query) return true;
       return (
        includesQuery(order.reference, query) ||
        includesQuery(order.customer, query) ||
        includesQuery(order.billing.email, query) ||
        includesQuery(order.billing.phone, query)
      );
    });
  }, [initialOrders, selectedMonth, sourceFilter, search]);

  // Split into Pipeline (Active) and Archive
  const pipelineOrders = useMemo(() => {
      return ordersFilteredByDate.filter(o => ACTIVE_STATUS_IDS.includes(o.status as OrderStatus));
  }, [ordersFilteredByDate]);

  const archivedOrders = useMemo(() => {
      return ordersFilteredByDate.filter(o => ARCHIVED_STATUS_IDS.includes(o.status as OrderStatus));
  }, [ordersFilteredByDate]);

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
            <Link href="/dashboard/crm/orders/new">
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
               <Link href="/dashboard/crm/orders/new">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
             <TabsList>
                 <TabsTrigger value="board">
                     <LayoutGrid className="mr-2 h-4 w-4" />
                     Pipeline
                 </TabsTrigger>
                 <TabsTrigger value="list">
                     <List className="mr-2 h-4 w-4" />
                     Lista Aktywnych
                 </TabsTrigger>
                 <TabsTrigger value="archive">
                     <FileText className="mr-2 h-4 w-4" />
                     Archiwum
                 </TabsTrigger>
             </TabsList>
             
             {/* Simple Search bar moved here for context */}
             <div className="flex items-center gap-2">
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj..."
                        className="pl-8 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                        <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtruj źródło</DropdownMenuLabel>
                        {SOURCE_FILTERS.map((filter) => (
                        <DropdownMenuItem 
                            key={filter.value}
                            onClick={() => setSourceFilter(filter.value)}
                            className={sourceFilter === filter.value ? "bg-accent" : ""}
                        >
                            {filter.label}
                        </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                    </DropdownMenu>
             </div>
         </div>

         <TabsContent value="board" className="mt-0 h-[calc(100vh-220px)]">
            <OrdersBoard orders={pipelineOrders} />
         </TabsContent>

         <TabsContent value="list" className="mt-0">
             <OrdersTable orders={pipelineOrders} />
         </TabsContent>
         
         <TabsContent value="archive" className="mt-0">
             <OrdersTable orders={archivedOrders} />
         </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();

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
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px] md:w-[250px]">Numer / Klient</TableHead>
            <TableHead className="hidden md:table-cell w-[200px]">Klient (Szczegóły)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead className="text-right">Kwota</TableHead>
            <TableHead className="hidden md:table-cell text-right w-[100px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow 
              key={order.id} 
              className="hover:bg-muted/30 transition-colors cursor-pointer h-16"
              onClick={() => router.push(`/dashboard/crm/orders/${order.id}`)}
            >
              <TableCell className="font-medium align-middle">
                <div className="flex flex-col gap-1">
                  <Link 
                    href={`/dashboard/crm/orders/${order.id}`}
                    className="hover:underline text-primary font-semibold text-base"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.reference}
                  </Link>
                  {/* Mobile only customer name */}
                  <span className="md:hidden text-xs text-muted-foreground truncate max-w-[120px]">
                    {order.customer}
                  </span>
                  {/* Desktop source */}
                  <span className="hidden md:flex text-xs text-muted-foreground capitalize items-center gap-1">
                    {order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell align-middle">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{order.customer}</span>
                  <span className="text-xs text-muted-foreground">{order.billing.email}</span>
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  {order.requiresReview && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-auto">Weryfikacja</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm align-middle">
                {formatDateTime(order.createdAt)}
              </TableCell>
              <TableCell className="text-right font-bold text-base align-middle">
                {formatCurrency(order.totals.totalGross, order.currency)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right align-middle">
                <div 
                  className="flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.requiresReview && (
                    <ConfirmOrderButton order={order} />
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
                        <Link href={`/dashboard/crm/orders/${order.id}`}>
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
    </div>
  );
}
