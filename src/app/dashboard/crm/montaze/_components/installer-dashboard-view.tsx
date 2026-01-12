"use client";

import { format, isToday, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from "date-fns";
import { pl } from "date-fns/locale";
import { MapPin, Calendar, Clock, AlertTriangle, Ruler, Hammer, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Montage, MeasurementMaterialItem } from "../types";

interface InstallerDashboardViewProps {
  montages: Montage[];
}

type SectionType = 'IN_PROGRESS' | 'THIS_WEEK' | 'NEXT_WEEK' | 'FUTURE' | 'BACKLOG' | 'PENDING';

export function InstallerDashboardView({ montages }: InstallerDashboardViewProps) {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  const getActionDate = (m: Montage) => {
    const isMeasurement = ['new_lead', 'contact_attempt', 'contact_established', 'measurement_scheduled', 'measurement_done'].includes(m.status);
    const dateVal = isMeasurement ? m.measurementDate : m.scheduledInstallationAt;
    return dateVal ? new Date(dateVal) : null;
  };

  const getSection = (m: Montage): SectionType => {
    if (m.status === 'installation_in_progress') return 'IN_PROGRESS';
    
    // Completed or Cancelled - hide or put in separate list (not handled here based on requirements)
    if (['completed', 'rejected', 'protocol_signed', 'on_hold'].includes(m.status)) return 'PENDING';

    const date = getActionDate(m);

    if (!date) {
        // If no date, but it's a status that implies waiting for office, maybe PENDING?
        // But user said "Do ustalenia" for assigned but no date.
        // Let's put everything without date in BACKLOG for now, unless it's clearly office side.
        if (['quote_in_progress', 'quote_sent', 'quote_accepted', 'order_processing', 'materials_ordered', 'measurement_done'].includes(m.status)) {
            return 'PENDING'; // Office side
        }
        return 'BACKLOG';
    }

    if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) return 'THIS_WEEK';
    if (isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) return 'NEXT_WEEK';
    if (date > nextWeekEnd) return 'FUTURE';
    
    // Past dates that are not completed -> BACKLOG (Overdue) or THIS_WEEK (if we want to show them as urgent)
    // Let's put them in THIS_WEEK but marked as overdue visually, or IN_PROGRESS if we want to force attention.
    // User said "W TOKU / PILNE" -> "Zlecenia, które mają status 'W toku' LUB są przeterminowane."
    if (date < currentWeekStart) return 'IN_PROGRESS'; 

    return 'BACKLOG';
  };

  const sections: Record<SectionType, Montage[]> = {
    IN_PROGRESS: [],
    THIS_WEEK: [],
    NEXT_WEEK: [],
    FUTURE: [],
    BACKLOG: [],
    PENDING: []
  };

  montages.forEach(m => {
    const section = getSection(m);
    sections[section].push(m);
  });

  // Sort each section
  const sortByDate = (a: Montage, b: Montage) => {
    const dateA = getActionDate(a)?.getTime() || 0;
    const dateB = getActionDate(b)?.getTime() || 0;
    return dateA - dateB;
  };

  sections.IN_PROGRESS.sort(sortByDate);
  sections.THIS_WEEK.sort(sortByDate);
  sections.NEXT_WEEK.sort(sortByDate);
  sections.FUTURE.sort(sortByDate);
  sections.BACKLOG.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  }); // Newest first

  const missingCostsMontages = montages.filter(m => {
      const materials = m.measurementAdditionalMaterials;
      if (!Array.isArray(materials)) return false;
      return materials.some((item: MeasurementMaterialItem) => item.supplySide === 'installer' && (!item.estimatedCost || item.estimatedCost <= 0));
  });

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-md mx-auto w-full">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Moje Zlecenia</h1>
        <p className="text-muted-foreground">Plan pracy na najbliższy czas.</p>
      </div>

      {missingCostsMontages.length > 0 && (
        <div className="px-4">
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="space-y-1 w-full">
                            <h3 className="font-medium text-amber-900">Uzupełnij koszty zakupów</h3>
                            <p className="text-sm text-amber-700">
                                Masz {missingCostsMontages.length} zleceń z nieuzupełnionymi kosztami.
                            </p>
                            <div className="pt-2 flex flex-col gap-2">
                                {missingCostsMontages.map(m => (
                                    <Link key={m.id} href={`/dashboard/crm/montaze/${m.id}?tab=measurement`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start bg-white border-amber-200 hover:bg-amber-100 text-amber-900">
                                            {m.clientName}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <div className="space-y-8">
        {/* 1. IN PROGRESS / URGENT */}
        {sections.IN_PROGRESS.length > 0 && (
            <div className="px-4 space-y-3">
                <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    W toku / Pilne
                </h2>
                {sections.IN_PROGRESS.map(m => (
                    <UnifiedMontageCard key={m.id} montage={m} date={getActionDate(m)} highlight />
                ))}
            </div>
        )}

        {/* 2. THIS WEEK */}
        <div className="px-4 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                W tym tygodniu
            </h2>
            {sections.THIS_WEEK.length === 0 ? (
                <p className="text-sm text-muted-foreground italic pl-1">Brak zadań na ten tydzień.</p>
            ) : (
                sections.THIS_WEEK.map(m => (
                    <UnifiedMontageCard key={m.id} montage={m} date={getActionDate(m)} />
                ))
            )}
        </div>

        {/* 3. NEXT WEEK */}
        {sections.NEXT_WEEK.length > 0 && (
            <div className="px-4 space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    W przyszłym tygodniu
                </h2>
                {sections.NEXT_WEEK.map(m => (
                    <UnifiedMontageCard key={m.id} montage={m} date={getActionDate(m)} compact />
                ))}
            </div>
        )}

        {/* 4. FUTURE */}
        {sections.FUTURE.length > 0 && (
            <div className="px-4 space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Dalsze terminy
                </h2>
                {sections.FUTURE.map(m => (
                    <UnifiedMontageCard key={m.id} montage={m} date={getActionDate(m)} compact />
                ))}
            </div>
        )}

        {/* 5. BACKLOG */}
        {sections.BACKLOG.length > 0 && (
            <div className="px-4 space-y-3">
                <h2 className="text-sm font-medium text-orange-600 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Do ustalenia / Akcja wymagana
                </h2>
                {sections.BACKLOG.map(m => (
                    <UnifiedMontageCard key={m.id} montage={m} date={null} compact />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

function UnifiedMontageCard({ montage, date, highlight = false, compact = false }: { montage: Montage, date: Date | null, highlight?: boolean, compact?: boolean }) {
  const isMeasurement = ['new_lead', 'contact_attempt', 'contact_established', 'measurement_scheduled', 'measurement_done'].includes(montage.status);
  const isTodayDate = date && isToday(date);

  return (
    <Link href={`/dashboard/crm/montaze/${montage.id}`} className="block group">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        highlight ? "border-red-200 bg-red-50/30" : "hover:border-primary/50",
        isTodayDate && !highlight ? "border-green-500/50 bg-green-50/10" : ""
      )}>
        <CardContent className={cn("p-4", compact && "py-3")}>
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isMeasurement ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 gap-1 px-1.5 h-5 text-[10px]">
                        <Ruler className="w-3 h-3" />
                        POMIAR
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 gap-1 px-1.5 h-5 text-[10px]">
                        <Hammer className="w-3 h-3" />
                        MONTAŻ
                    </Badge>
                )}
                
                <h3 className={cn("font-semibold leading-tight group-hover:text-primary transition-colors", compact ? "text-sm" : "text-base")}>
                  {montage.clientName}
                </h3>
              </div>
              
              {!compact && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">
                    {montage.installationCity || montage.installationAddress || "Brak adresu"}
                    </span>
                </div>
              )}

              {date ? (
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  isTodayDate ? "text-green-600 font-medium" : "text-muted-foreground",
                  highlight ? "text-red-600 font-medium" : ""
                )}>
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {format(date, "EEEE, d MMMM", { locale: pl })}
                    {isTodayDate && " (Dziś)"}
                  </span>
                </div>
              ) : (
                  <div className="flex items-center gap-2 text-sm text-orange-600/80">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>Do ustalenia</span>
                  </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
