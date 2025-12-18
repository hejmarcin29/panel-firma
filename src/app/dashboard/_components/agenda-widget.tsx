"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CalendarDays } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export interface AgendaItem {
    id: string;
    clientName: string;
    installationCity: string | null;
    scheduledInstallationAt: Date | number | string | null;
    displayId: string | null;
    floorArea: number | null;
}

interface AgendaWidgetProps {
  upcomingMontages: AgendaItem[];
}

export function AgendaWidget({ upcomingMontages }: AgendaWidgetProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

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
            <motion.div 
              className="space-y-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {upcomingMontages.map((montage) => (
                <motion.div variants={item} key={montage.id}>
                <Link 
                    href={`/dashboard/crm/montaze/${montage.id}`}
                    className="relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-none pt-0.5">{montage.clientName}</p>
                        {montage.displayId && (
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground px-1.5 py-0 h-5">
                                {montage.displayId}
                            </Badge>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="mr-1.5 h-3 w-3 shrink-0" />
                            <span className="truncate">{montage.installationCity || "Brak adresu"}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1.5 h-3 w-3 shrink-0" />
                            <span>
                                {montage.scheduledInstallationAt 
                                    ? new Date(montage.scheduledInstallationAt).toLocaleDateString('pl-PL', { 
                                        weekday: 'short', 
                                        day: 'numeric', 
                                        month: 'long' 
                                      }) 
                                    : 'Nieustalona data'}
                            </span>
                        </div>
                    </div>
                  </div>
                </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
