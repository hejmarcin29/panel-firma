"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, FileText, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { motion } from "framer-motion";
import { getStatusLabel } from "@/lib/montaze/statuses-shared";

export interface MeasurementAlert {
    id: string;
    clientName: string;
    status: string;
    createdAt: Date | string | number | null;
    updatedAt: Date | string | number | null;
}

export interface MeasurementAlertItem {
    montage: MeasurementAlert;
    issues: string[];
}

export function MeasurementAlertsKPI({ alerts }: { alerts: MeasurementAlertItem[] }) {
    const alertCount = alerts.length;
    const hasAlerts = alertCount > 0;

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
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${hasAlerts ? "border-destructive/50 shadow-sm" : ""}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Zagrożone pomiary i oferty
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/settings?tab=kpi" onClick={(e) => e.stopPropagation()}>
                                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </Link>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="focus:outline-none" onClick={(e) => e.stopPropagation()}>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="max-w-xs">
                                    <p className="text-sm">
                                        Lista tematów sprzedażowych wymagających uwagi (brak Opiekuna, brak oferty, brak decyzji).
                                    </p>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className={hasAlerts ? "text-2xl font-bold text-destructive" : "text-2xl font-bold"}>
                                {alertCount}
                            </div>
                            {hasAlerts ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {hasAlerts ? "Kliknij, aby zobaczyć szczegóły" : "Wszystko pod kontrolą"}
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Zagrożone pomiary i oferty ({alertCount})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full max-h-[60vh] pr-4">
                    {hasAlerts ? (
                        <motion.div 
                            className="space-y-4"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {alerts.map(({ montage, issues }) => (
                                <motion.div variants={item} key={montage.id} className="border rounded-lg p-4 bg-card">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <Link 
                                                href={`/dashboard/crm/montaze/${montage.id}`}
                                                className="font-semibold hover:underline text-lg"
                                            >
                                                {montage.clientName}
                                            </Link>
                                            <div className="text-sm text-muted-foreground">
                                                Status: {getStatusLabel(montage.status)}
                                            </div>
                                        </div>
                                        <Link 
                                            href={`/dashboard/crm/montaze/${montage.id}`}
                                            className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-md hover:bg-primary/20"
                                        >
                                            Otwórz
                                        </Link>
                                    </div>
                                    <div className="space-y-1">
                                        {issues.map((issue, idx) => (
                                            <div key={idx} className="flex items-center text-sm text-destructive font-medium">
                                                <AlertTriangle className="h-3 w-3 mr-2" />
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Brak zagrożonych tematów sprzedażowych.
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
