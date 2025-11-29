"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, AlertCircle, Users } from "lucide-react";

interface KPICardsProps {
  todayMontagesCount: number;
  newLeadsCount: number;
  pendingPaymentsCount: number; // Or some other metric
  urgentTasksCount: number;
}

export function KPICards({
  todayMontagesCount,
  newLeadsCount,
  pendingPaymentsCount,
  urgentTasksCount,
}: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dzisiejsze montaże</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayMontagesCount}</div>
          <p className="text-xs text-muted-foreground">
            Zaplanowane na dziś
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nowe Leady</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newLeadsCount}</div>
          <p className="text-xs text-muted-foreground">
            Oczekują na kontakt
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Oczekujące płatności</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPaymentsCount}</div>
          <p className="text-xs text-muted-foreground">
            Przed wpłatą
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pilne sprawy</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{urgentTasksCount}</div>
          <p className="text-xs text-muted-foreground">
            Wymagają uwagi
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
