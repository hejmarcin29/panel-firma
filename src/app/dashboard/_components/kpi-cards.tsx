"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    AlertCircle, 
    Briefcase, 
    ShoppingCart, 
    ListTodo, 
    CalendarDays, 
    ArrowUpRight,
    CreditCard
} from "lucide-react";
import Link from "next/link";

interface KPICardsProps {
  todayMontagesCount: number;
  newLeadsCount: number;
  pendingPaymentsCount: number;
  urgentTasksCount: number;
  newOrdersCount: number;
  todoCount: number;
  urgentOrdersCount?: number;
  stalledOrdersCount?: number;
  orderUrgentDays?: number;
  settings?: {
      visibleCards?: string[];
  };
}

export function KPICards({
  todayMontagesCount,
  newLeadsCount,
  pendingPaymentsCount,
  urgentTasksCount,
  newOrdersCount,
  todoCount,
  urgentOrdersCount = 0,
  stalledOrdersCount = 0,
  settings
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'payments', 'urgent', 'orders', 'todo', 'urgentOrders', 'stalledOrders'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
      {visibleCards.includes('urgent') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/montaze?filter=urgent" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pilne Montaże
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{urgentTasksCount}</div>
                <p className="text-xs text-orange-500/80 flex items-center mt-1">
                    Wymagają uwagi <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('leads') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aktywne Leady
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{newLeadsCount}</div>
                <p className="text-xs text-blue-500/80 flex items-center mt-1">
                    W realizacji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('orders') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nowe Zamówienia
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{newOrdersCount}</div>
                <p className="text-xs text-emerald-500/80 flex items-center mt-1">
                    Do weryfikacji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('today') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Dzisiaj
                </CardTitle>
                <CalendarDays className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold text-foreground truncate">
                    {todayMontagesCount > 0 ? `${todayMontagesCount} montaży` : new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                </div>
                <p className="text-xs text-purple-500/80 mt-1 truncate">
                    {new Date().toLocaleDateString('pl-PL', { weekday: 'long' })}
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('todo') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/todo" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Zadania ToDo
                </CardTitle>
                <ListTodo className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{todoCount}</div>
                <p className="text-xs text-pink-500/80 flex items-center mt-1">
                    Do zrobienia <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('payments') && (
        <Card className="bg-card border-border shadow-none relative overflow-hidden group">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Płatności
                </CardTitle>
                <CreditCard className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{pendingPaymentsCount}</div>
                <p className="text-xs text-yellow-500/80 flex items-center mt-1">
                    Oczekujące <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('urgentOrders') && urgentOrdersCount > 0 && (
        <Card className="shadow-none relative overflow-hidden group border-red-500/20 bg-red-500/5">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-red-600">
                    Pilne Zamówienia
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-red-700">{urgentOrdersCount}</div>
                <p className="text-xs text-red-600/80 flex items-center mt-1">
                    Wymagają reakcji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}

      {visibleCards.includes('stalledOrders') && stalledOrdersCount > 0 && (
        <Card className="shadow-none relative overflow-hidden group border-orange-500/20 bg-orange-500/5">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-orange-600">
                    Brak Faktury
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-orange-700">{stalledOrdersCount}</div>
                <p className="text-xs text-orange-600/80 flex items-center mt-1">
                    Wymagają wystawienia <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
