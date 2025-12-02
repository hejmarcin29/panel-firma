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
  settings?: {
      visibleCards?: string[];
  };
}

function InfoIcon({ content }: { content: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => e.preventDefault()}>
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
  settings,
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'orders', 'payments', 'urgent', 'todo'];

  return (
    <div className="grid grid-cols-2 gap-2">
      {visibleCards.includes('today') && (
        <Link href="/dashboard/montaze">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dzisiejsze</span>
                    <InfoIcon content="Liczba montaży zaplanowanych na dzisiaj." />
                </div>
                <div className="text-xl font-bold mt-1">{todayMontagesCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
      {visibleCards.includes('todo') && (
        <Link href="/dashboard/todo">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">To Do</span>
                    <InfoIcon content="Liczba zadań w Twoim osobistym organizerze." />
                </div>
                <div className="text-xl font-bold mt-1">{todoCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
      {visibleCards.includes('leads') && (
        <Link href="/dashboard/montaze">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Leady Montaż</span>
                    <InfoIcon content="Liczba nowych zapytań (status Lead)." />
                </div>
                <div className="text-xl font-bold mt-1">{newLeadsCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
      {visibleCards.includes('orders') && (
        <Link href="/dashboard/orders">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Zamówienia</span>
                    <InfoIcon content="Liczba nowych zamówień (status Zamówienie utworzone)." />
                </div>
                <div className="text-xl font-bold mt-1">{newOrdersCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
      {visibleCards.includes('payments') && (
        <Link href="/dashboard/montaze">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Płatności</span>
                    <InfoIcon content="Liczba montaży oczekujących na płatność (przed zaliczką lub fakturą końcową)." />
                </div>
                <div className="text-xl font-bold mt-1">{pendingPaymentsCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
      {visibleCards.includes('urgent') && (
        <Link href="/dashboard/zadania">
            <Card className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center border-red-200 bg-red-50/50 dark:bg-red-900/10 relative h-full">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-red-600/80 font-bold tracking-wider">Pilne</span>
                    <InfoIcon content="Liczba aktywnych montaży bez ustalonej daty realizacji." />
                </div>
                <div className="text-xl font-bold mt-1 text-red-600">{urgentTasksCount}</div>
                </CardContent>
            </Card>
        </Link>
      )}
    </div>
  );
}
