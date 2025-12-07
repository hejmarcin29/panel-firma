"use client";

import { format, isToday, isFuture } from "date-fns";
import { pl } from "date-fns/locale";
import { MapPin, Phone, Calendar, Clock, Navigation } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Montage } from "../types";

interface InstallerDashboardViewProps {
  montages: Montage[];
}

export function InstallerDashboardView({ montages }: InstallerDashboardViewProps) {
  // Sort montages by date
  const sortedMontages = [...montages].sort((a, b) => {
    const dateA = a.scheduledInstallationAt ? new Date(a.scheduledInstallationAt).getTime() : 0;
    const dateB = b.scheduledInstallationAt ? new Date(b.scheduledInstallationAt).getTime() : 0;
    // If no date, put at the end
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });
  
  const todayMontages = sortedMontages.filter(m => 
    m.scheduledInstallationAt && isToday(new Date(m.scheduledInstallationAt))
  );

  const upcomingMontages = sortedMontages.filter(m => 
    m.scheduledInstallationAt && isFuture(new Date(m.scheduledInstallationAt)) && !isToday(new Date(m.scheduledInstallationAt))
  );

  const unscheduledMontages = sortedMontages.filter(m => !m.scheduledInstallationAt && m.status !== 'completed');

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-md mx-auto w-full">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Cześć! 👋</h1>
        <p className="text-muted-foreground">Twoje zlecenia na najbliższy czas.</p>
      </div>

      {/* TODAY SECTION */}
      <div className="space-y-3 px-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Dziś
        </h2>
        
        {todayMontages.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Brak zaplanowanych montaży na dziś.</p>
            </CardContent>
          </Card>
        ) : (
          todayMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} isToday={true} />
          ))
        )}
      </div>

      {/* UPCOMING SECTION */}
      {upcomingMontages.length > 0 && (
        <div className="space-y-3 px-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Nadchodzące
          </h2>
          {upcomingMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} />
          ))}
        </div>
      )}

      {/* UNSCHEDULED SECTION */}
      {unscheduledMontages.length > 0 && (
        <div className="space-y-3 px-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Do ustalenia / Inne
          </h2>
          {unscheduledMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function MontageCard({ montage, isToday = false, compact = false }: { montage: Montage, isToday?: boolean, compact?: boolean }) {
  const date = montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : null;
  
  return (
    <Link href={`/dashboard/montaze/${montage.id}`} className="block group">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        isToday ? "border-primary/50 shadow-sm bg-linear-to-br from-card to-primary/5" : "hover:border-primary/30"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
              {date ? (
                <div className={cn("flex items-center gap-1.5 font-semibold", isToday ? "text-primary text-lg" : "text-foreground")}>
                  <Clock className="h-4 w-4" />
                  {format(date, "HH:mm")}
                  {!isToday && <span className="text-muted-foreground text-sm font-normal ml-1">
                    {format(date, "EEE, d MMM", { locale: pl })}
                  </span>}
                </div>
              ) : (
                <Badge variant="outline" className="w-fit">Do ustalenia</Badge>
              )}
            </div>
            {isToday && (
               <Badge className="bg-green-500 hover:bg-green-600 border-transparent">DZIŚ</Badge>
            )}
          </div>

          <div className="space-y-1 mb-4">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {montage.clientName}
            </h3>
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {montage.installationAddress || "Brak adresu"}
                {montage.installationCity && `, ${montage.installationCity}`}
              </span>
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                className="w-full gap-2 h-10" 
                onClick={(e) => {
                  e.preventDefault();
                  if (montage.contactPhone) {
                    window.location.href = `tel:${montage.contactPhone}`;
                  }
                }}
                disabled={!montage.contactPhone}
              >
                <Phone className="h-4 w-4" />
                Zadzwoń
              </Button>
              <Button 
                className="w-full gap-2 h-10"
                onClick={(e) => {
                  e.preventDefault();
                  const address = `${montage.installationAddress}, ${montage.installationCity}`;
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                }}
              >
                <Navigation className="h-4 w-4" />
                Nawiguj
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
