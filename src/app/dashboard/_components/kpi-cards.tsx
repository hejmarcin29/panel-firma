"use client";

import { Card, CardContent } from "@/components/ui/card";

interface KPICardsProps {
  todayMontagesCount: number;
  newLeadsCount: number;
  pendingPaymentsCount: number; // Or some other metric
  urgentTasksCount: number;
  settings?: {
      visibleCards?: string[];
  };
}

export function KPICards({
  todayMontagesCount,
  newLeadsCount,
  pendingPaymentsCount,
  urgentTasksCount,
  settings,
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['today', 'leads', 'payments', 'urgent'];

  return (
    <div className="grid grid-cols-2 gap-2">
      {visibleCards.includes('today') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dzisiejsze</span>
            <div className="text-xl font-bold mt-1">{todayMontagesCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('leads') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Leady</span>
            <div className="text-xl font-bold mt-1">{newLeadsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('payments') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Płatności</span>
            <div className="text-xl font-bold mt-1">{pendingPaymentsCount}</div>
            </CardContent>
        </Card>
      )}
      {visibleCards.includes('urgent') && (
        <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center border-red-200 bg-red-50/50 dark:bg-red-900/10">
            <span className="text-[10px] uppercase text-red-600/80 font-bold tracking-wider">Pilne</span>
            <div className="text-xl font-bold mt-1 text-red-600">{urgentTasksCount}</div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
