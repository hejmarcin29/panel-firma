"use client";

import { format, isToday, isFuture } from "date-fns";
import { pl } from "date-fns/locale";
import { MapPin, Phone, Calendar, Clock, Navigation, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Montage } from "../types";

interface InstallerDashboardViewProps {
  montages: Montage[];
}

export function InstallerDashboardView({ montages }: InstallerDashboardViewProps) {
  const measurements = montages.filter(m => m.status === 'before_measurement');
  const installations = montages.filter(m => ['before_installation', 'before_final_invoice'].includes(m.status));
  const skirtings = montages.filter(m => m.status === 'before_skirting_installation');

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-md mx-auto w-full">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Cześć! 👋</h1>
        <p className="text-muted-foreground">Twoje zlecenia na najbliższy czas.</p>
      </div>

      <Tabs defaultValue="measurements" className="w-full">
        <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="measurements">Pomiary</TabsTrigger>
                <TabsTrigger value="installations">Montaże</TabsTrigger>
                <TabsTrigger value="skirtings">Listwy</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="measurements" className="mt-4">
            <MontageList montages={measurements} dateField="measurementDate" fallbackDateField="forecastedInstallationDate" />
        </TabsContent>
        
        <TabsContent value="installations" className="mt-4">
            <MontageList montages={installations} dateField="scheduledInstallationAt" />
        </TabsContent>

        <TabsContent value="skirtings" className="mt-4">
            <MontageList montages={skirtings} dateField="scheduledSkirtingInstallationAt" showLogisticsAlert />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MontageList({ montages, dateField, fallbackDateField, showLogisticsAlert }: { montages: Montage[], dateField: keyof Montage, fallbackDateField?: keyof Montage, showLogisticsAlert?: boolean }) {
  const sortedMontages = [...montages].sort((a, b) => {
    const dateAVal = a[dateField] || (fallbackDateField ? a[fallbackDateField] : null);
    const dateBVal = b[dateField] || (fallbackDateField ? b[fallbackDateField] : null);
    
    const dateA = dateAVal ? new Date(dateAVal as string | number | Date).getTime() : 0;
    const dateB = dateBVal ? new Date(dateBVal as string | number | Date).getTime() : 0;
    
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });
  
  const getDate = (m: Montage) => {
      const val = m[dateField] || (fallbackDateField ? m[fallbackDateField] : null);
      return val ? new Date(val as string | number | Date) : null;
  };

  const todayMontages = sortedMontages.filter(m => {
    const d = getDate(m);
    return d && isToday(d);
  });

  const upcomingMontages = sortedMontages.filter(m => {
    const d = getDate(m);
    return d && isFuture(d) && !isToday(d);
  });

  const unscheduledMontages = sortedMontages.filter(m => !getDate(m) && m.status !== 'completed');

  return (
      <>
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
              <p className="text-sm text-muted-foreground">Brak zaplanowanych zadań na dziś.</p>
            </CardContent>
          </Card>
        ) : (
          todayMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} date={getDate(montage)} isToday={true} showLogisticsAlert={showLogisticsAlert} />
          ))
        )}
      </div>

      {/* UPCOMING SECTION */}
      {upcomingMontages.length > 0 && (
        <div className="space-y-3 px-4 mt-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Nadchodzące
          </h2>
          {upcomingMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} date={getDate(montage)} showLogisticsAlert={showLogisticsAlert} />
          ))}
        </div>
      )}

      {/* UNSCHEDULED SECTION */}
      {unscheduledMontages.length > 0 && (
        <div className="space-y-3 px-4 mt-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Do ustalenia / Inne
          </h2>
          {unscheduledMontages.map(montage => (
            <MontageCard key={montage.id} montage={montage} date={null} compact showLogisticsAlert={showLogisticsAlert} />
          ))}
        </div>
      )}
      </>
  );
}

function MontageCard({ montage, date, isToday = false, compact = false, showLogisticsAlert = false }: { montage: Montage, date: Date | null, isToday?: boolean, compact?: boolean, showLogisticsAlert?: boolean }) {
  
  return (
    <Link href={`/dashboard/crm/montaze/${montage.id}`} className="block group">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        isToday ? "border-green-500/50 bg-green-50/10 dark:bg-green-950/10" : "hover:border-primary/50"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold leading-none group-hover:text-primary transition-colors">
                  {montage.clientName}
                </h3>
                {montage.isCompany && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">Firma</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {montage.installationCity || montage.installationAddress || "Brak adresu"}
                </span>
              </div>

              {date && (
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  isToday ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"
                )}>
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {format(date, "EEEE, d MMMM", { locale: pl })}
                    {isToday && " (Dziś)"}
                  </span>
                </div>
              )}

              {showLogisticsAlert && (
                  <div className="pt-2 space-y-1">
                      {montage.skirtingMaterialStatus === 'in_stock' && montage.skirtingMaterialClaimType === 'installer_pickup' && (
                          <Badge variant="destructive" className="w-full justify-center py-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              ZABIERZ LISTWY Z MAGAZYNU!
                          </Badge>
                      )}
                      {montage.skirtingMaterialStatus === 'in_stock' && montage.skirtingMaterialClaimType !== 'installer_pickup' && (
                          <Badge variant="outline" className="w-full justify-center py-1">
                              <Navigation className="w-3 h-3 mr-1" />
                              Dostawa firmowa (Na magazynie)
                          </Badge>
                      )}
                      {montage.skirtingMaterialStatus === 'delivered' && (
                          <Badge variant="secondary" className="w-full justify-center py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <Package className="w-3 h-3 mr-1" />
                              Listwy są u klienta
                          </Badge>
                      )}
                  </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
               {/* Status Badge or other info */}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
