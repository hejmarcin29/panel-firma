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
  todoCount: number;
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
  settings,
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'orders', 'payments', 'urgent', 'todo'];

  return (
    <div className="grid grid-cols-2 gap-4">
      {visibleCards.includes('today') && (
        <Card>
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dzisiejsze</span>
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <InfoIcon content="Liczba montaży zaplanowanych na dzisiaj." />
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{todayMontagesCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('todo') && (
        <Card>
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Do</span>
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <InfoIcon content="Liczba zadań w Twoim osobistym organizerze." />
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{todoCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('leads') && (
        <Card>
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leady Montaż</span>
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <InfoIcon content="Liczba nowych zapytań (status Lead)." />
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{newLeadsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('orders') && (
        <Card>
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zamówienia</span>
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <InfoIcon content="Liczba nowych zamówień (status Zamówienie utworzone)." />
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{newOrdersCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('payments') && (
        <Card>
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Płatności</span>
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <InfoIcon content="Liczba montaży oczekujących na płatność (przed zaliczką lub fakturą końcową)." />
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{pendingPaymentsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('urgent') && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="p-5 flex flex-col items-start justify-between h-full relative">
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600/80">Pilne</span>
                <div className="p-1.5 bg-red-100 rounded-md text-red-600">
                    <InfoIcon content="Liczba aktywnych montaży bez ustalonej daty realizacji." />
                </div>
            </div>
            <div className="text-3xl font-bold text-red-600">{urgentTasksCount}</div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
