"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin } from "lucide-react";
import Link from "next/link";

interface AgendaItem {
    id: string;
    clientName: string;
    installationCity: string | null;
    scheduledInstallationAt: Date | number | string | null;
}

interface AgendaWidgetProps {
  todayMontages: AgendaItem[];
}

export function AgendaWidget({ todayMontages }: AgendaWidgetProps) {
  return (
    <Card className="col-span-1 md:col-span-1 h-full">
      <CardHeader>
        <CardTitle>Agenda na Dziś</CardTitle>
        <CardDescription>Twoje zadania i montaże na dzisiaj</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {todayMontages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Brak zaplanowanych montaży na dziś.</p>
          ) : (
            <div className="space-y-4">
              {todayMontages.map((montage) => (
                <Link 
                    key={montage.id} 
                    href={`/dashboard/montaze/${montage.id}`}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{montage.clientName}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {montage.installationCity || "Brak adresu"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Cały dzień'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
