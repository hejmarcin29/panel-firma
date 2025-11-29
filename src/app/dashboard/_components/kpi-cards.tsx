"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
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
  settings,
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'orders', 'payments', 'urgent'];

  return (
    <div className="grid grid-cols-2 gap-2">
      {visibleCards.includes('today') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative">
            <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dzisiejsze</span>
                <InfoIcon content="Liczba montaży zaplanowanych na dzisiaj." />
            </div>
            <div className="text-xl font-bold mt-1">{todayMontagesCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('leads') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative">
            <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Leady</span>
                <InfoIcon content="Liczba nowych zapytań (status Lead)." />
            </div>
            <div className="text-xl font-bold mt-1">{newLeadsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('orders') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative">
            <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Zamówienia</span>
                <InfoIcon content="Liczba nowych zamówień (status Zamówienie utworzone)." />
            </div>
            <div className="text-xl font-bold mt-1">{newOrdersCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('payments') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center relative">
            <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Płatności</span>
                <InfoIcon content="Liczba montaży oczekujących na płatność (przed zaliczką lub fakturą końcową)." />
            </div>
            <div className="text-xl font-bold mt-1">{pendingPaymentsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('urgent') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center border-red-200 bg-red-50/50 dark:bg-red-900/10 relative">
            <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase text-red-600/80 font-bold tracking-wider">Pilne</span>
                <InfoIcon content="Liczba aktywnych montaży bez ustalonej daty realizacji." />
            </div>
            <div className="text-xl font-bold mt-1 text-red-600">{urgentTasksCount}</div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
