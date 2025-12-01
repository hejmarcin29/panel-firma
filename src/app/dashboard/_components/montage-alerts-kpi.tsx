"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

export interface MontageAlert {
    id: string;
    clientName: string;
    scheduledInstallationAt: Date | string | number | null;
    isMaterialOrdered: boolean;
    isInstallerConfirmed: boolean;
}

export function MontageAlertsKPI({ alerts }: { alerts: MontageAlert[] }) {
    const alertCount = alerts.length;
    const hasAlerts = alertCount > 0;

    return (
        <Card className={hasAlerts ? "border-destructive/50 shadow-sm" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Zagrożone montaże
                </CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>Licznik pokazuje montaże zaplanowane na najbliższe 7 dni roboczych, które wciąż nie mają zamówionego materiału lub potwierdzonego montażysty.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className={hasAlerts ? "text-2xl font-bold text-destructive" : "text-2xl font-bold"}>
                        {alertCount}
                    </div>
                    {hasAlerts && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {hasAlerts ? "Wymagają natychmiastowej uwagi" : "Wszystko pod kontrolą"}
                </p>
                
                {hasAlerts && (
                    <div className="mt-4 space-y-2">
                        {alerts.slice(0, 3).map(m => (
                            <Link key={m.id} href={`/dashboard/montaze/${m.id}`} className="block">
                                <div className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20 hover:bg-destructive/20 transition-colors">
                                    <div className="font-medium">{m.clientName}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {m.scheduledInstallationAt ? new Date(m.scheduledInstallationAt).toLocaleDateString('pl-PL') : 'Brak daty'}
                                        {!m.isMaterialOrdered && <span className="ml-2 text-destructive font-medium">• Brak materiału</span>}
                                        {!m.isInstallerConfirmed && <span className="ml-2 text-destructive font-medium">• Brak montażysty</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {alertCount > 3 && (
                            <Link href="/dashboard/montaze" className="text-xs text-muted-foreground hover:underline block text-center">
                                + {alertCount - 3} więcej
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

