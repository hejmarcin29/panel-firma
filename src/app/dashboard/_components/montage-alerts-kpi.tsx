"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { motion } from "framer-motion";

export interface MontageAlert {
    id: string;
    clientName: string;
    scheduledInstallationAt: Date | string | number | null;
    materialStatus: 'none' | 'ordered' | 'in_stock' | 'delivered';
    installerStatus: 'none' | 'informed' | 'confirmed';
}

export interface MontageAlertItem {
    montage: MontageAlert;
    issues: string[];
}

export function MontageAlertsKPI({ alerts }: { alerts: MontageAlertItem[] }) {
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
                            Zagrożone montaże
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
                                        Lista montaży wymagających uwagi (brak statusów, brak przypisań, zagrożone terminy materiałowe).
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
                            {hasAlerts && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {hasAlerts ? "Kliknij, aby zobaczyć szczegóły" : "Wszystko pod kontrolą"}
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Zagrożone montaże ({alertCount})</DialogTitle>
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
                                                {montage.scheduledInstallationAt 
                                                    ? format(new Date(montage.scheduledInstallationAt), "d MMMM yyyy", { locale: pl })
                                                    : "Brak daty"}
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
                            Brak zagrożonych montaży.
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

