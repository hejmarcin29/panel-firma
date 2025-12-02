"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface KPICardsProps {
  todayMontagesCount: number;
  newLeadsCount: number;
  pendingPaymentsCount: number; // Or some other metric
  urgentTasksCount: number;
  newOrdersCount: number;
  todoCount: number;
  urgentOrdersCount?: number;
  orderUrgentDays?: number;
  settings?: {
      visibleCards?: string[];
  };
}

function InfoIcon({ content }: { content: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3 w-3" />
                    <span className="sr-only">Informacja</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 text-sm p-3">
                {content}
            </PopoverContent>
        </Popover>
    );
}

export function KPICards({
  todayMontagesCount,
  newLeadsCount,
  pendingPaymentsCount,
  urgentTasksCount,
  newOrdersCount,
  todoCount,
  urgentOrdersCount = 0,
  orderUrgentDays = 3,
  settings,
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'orders', 'payments', 'urgent', 'todo', 'urgentOrders'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 h-full">
      {visibleCards.includes('today') && (
        <Card className="hover:bg-accent/50 transition-colors h-full relative">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dzisiejsze</span>
                <InfoIcon content="Liczba montaży zaplanowanych na dzisiaj." />
            </div>
            <div className="text-xl font-bold mt-1 pointer-events-none relative z-0">{todayMontagesCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('todo') && (
        <Card className="hover:bg-accent/50 transition-colors h-full relative">
            <Link href="/dashboard/todo" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">To Do</span>
                <InfoIcon content="Liczba zadań w Twoim osobistym organizerze." />
            </div>
            <div className="text-xl font-bold mt-1 pointer-events-none relative z-0">{todoCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('leads') && (
        <Card className="hover:bg-accent/50 transition-colors h-full relative">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Leady Montaż</span>
                <InfoIcon content="Liczba nowych zapytań (status Lead)." />
            </div>
            <div className="text-xl font-bold mt-1 pointer-events-none relative z-0">{newLeadsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('orders') && (
        <Card className="hover:bg-accent/50 transition-colors h-full relative">
            <Link href="/dashboard/orders" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Zamówienia</span>
                <InfoIcon content="Liczba nowych zamówień (status Zamówienie utworzone)." />
            </div>
            <div className="text-xl font-bold mt-1 pointer-events-none relative z-0">{newOrdersCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('payments') && (
        <Card className="hover:bg-accent/50 transition-colors h-full relative">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Płatności</span>
                <InfoIcon content="Liczba montaży oczekujących na płatność (przed zaliczką lub fakturą końcową)." />
            </div>
            <div className="text-xl font-bold mt-1 pointer-events-none relative z-0">{pendingPaymentsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('urgent') && (
        <Card className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-full relative">
            <Link href="/dashboard/zadania" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center border-red-200 bg-red-50/50 dark:bg-red-900/10 relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-red-600/80 font-bold tracking-wider">Pilne Montaże</span>
                <InfoIcon content="Liczba aktywnych montaży bez ustalonej daty realizacji." />
            </div>
            <div className="text-xl font-bold mt-1 text-red-600 pointer-events-none relative z-0">{urgentTasksCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('urgentOrders') && (
        <Card className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-full relative">
            <Link href="/dashboard/orders" className="absolute inset-0 z-0" />
            <CardContent className="p-3 flex flex-col items-center justify-center text-center border-red-200 bg-red-50/50 dark:bg-red-900/10 relative h-full pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto relative z-10">
                <span className="text-[10px] uppercase text-red-600/80 font-bold tracking-wider">Pilne Zamówienia</span>
                <InfoIcon content={`Liczba zamówień bez zmiany statusu od ponad ${orderUrgentDays} dni.`} />
            </div>
            <div className="text-xl font-bold mt-1 text-red-600 pointer-events-none relative z-0">{urgentOrdersCount}</div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
