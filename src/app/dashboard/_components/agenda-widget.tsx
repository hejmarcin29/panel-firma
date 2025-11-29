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
    displayId: string | null;
}

interface AgendaWidgetProps {
  upcomingMontages: AgendaItem[];
}

export function AgendaWidget({ upcomingMontages }: AgendaWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Najbliższe montaże</CardTitle>
        <CardDescription>3 nadchodzące realizacje</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {upcomingMontages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Brak nadchodzących montaży.</p>
          ) : (
            <div className="space-y-4">
              {upcomingMontages.map((montage) => (
                <Link 
                    key={montage.id} 
                    href={`/dashboard/montaze/${montage.id}`}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                    {montage.displayId || 'M'}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{montage.clientName}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {montage.installationCity || "Brak adresu"}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleDateString() : 'Nieustalona data'}
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
