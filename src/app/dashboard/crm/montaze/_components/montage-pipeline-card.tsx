'use client';

import { useMemo } from 'react';
import { Phone, Mail, MapPin, Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import type { Montage, StatusOption, AlertSettings } from '../types';
import { formatScheduleRange } from '../utils';

function countCompleted(tasks: Montage['tasks']): number {
	return tasks.filter((task) => task.completed).length;
}

function initials(name: string) {
	const matches = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((segment) => segment[0]?.toUpperCase() ?? '');
	return matches.join('') || 'M';
}

type Props = {
	montage: Montage;
	statusOptions: StatusOption[];
    threatDays: number;
    alertSettings?: AlertSettings;
};

export function MontagePipelineCard({ montage, threatDays, alertSettings }: Props) {
	const completedTasks = useMemo(() => countCompleted(montage.tasks), [montage.tasks]);
	const totalTasks = montage.tasks.length;
    const hasClientInfo = Boolean(montage.clientInfo?.trim());
	const billingAddress = montage.billingAddress;
	const installationAddress = montage.installationAddress;
	const addressLine = installationAddress || billingAddress;
	const cityLine = montage.installationCity || montage.billingCity || null;
	const scheduledDate = useMemo(() => formatScheduleRange(montage.scheduledInstallationAt, montage.scheduledInstallationEndAt), [montage.scheduledInstallationAt, montage.scheduledInstallationEndAt]);
	const forecastedDate = montage.forecastedInstallationDate 
        ? new Date(montage.forecastedInstallationDate as string | number | Date).toLocaleDateString('pl-PL')
        : null;

    const pendingTasksCount = totalTasks - completedTasks;

    const isThreatened = useMemo(() => {
        const dateToCheck = montage.scheduledInstallationAt || montage.forecastedInstallationDate;
        if (!dateToCheck) return false;
        // Ignore completed statuses if needed, but for now just check date
        if (montage.status === 'completed' || montage.status === 'cancelled') return false;

        const now = new Date();
        const scheduled = new Date(dateToCheck);
        const diffTime = scheduled.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Check specific alerts if settings are provided
        if (alertSettings) {
             if (diffDays <= alertSettings.missingMaterialStatusDays && montage.materialStatus === 'none') return true;
             if (diffDays <= alertSettings.missingInstallerStatusDays && montage.installerStatus === 'none') return true;
             if (diffDays <= alertSettings.missingMeasurerDays && !montage.measurerId) return true;
             if (diffDays <= alertSettings.missingInstallerDays && !montage.installerId) return true;
             
             if (diffDays >= 0) {
                if (diffDays <= alertSettings.materialOrderedDays && montage.materialStatus === 'ordered') return true;
                if (diffDays <= alertSettings.materialInstockDays && montage.materialStatus === 'in_stock') {
                    const isPickup = montage.materialClaimType === 'installer_pickup' || montage.materialClaimType === 'client_pickup';
                    if (!isPickup) return true;
                }
             }
        } else {
            // Fallback if no settings provided
            if (diffDays >= 0 && diffDays <= threatDays) return true;
        }

        return false;
    }, [montage, threatDays, alertSettings]);

    return (
        <Link href={`/dashboard/crm/montaze/${montage.id}`} className="block group relative">
             <Card className={cn(
                "w-full transition-all duration-200 border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 overflow-hidden",
                isThreatened ? "bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/30" : "bg-card"
            )}>
                {/* Status Strip for Threatened */}
                {isThreatened && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                )}

                <div className={cn("p-3 space-y-3", isThreatened && "pl-4")}>
                    {/* Header: Name & ID */}
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight truncate pr-2">
                                {montage.clientName}
                            </h3>
                            {montage.displayId && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                    {montage.displayId}
                                </p>
                            )}
                        </div>
                        {/* Team Avatars */}
                        <div className="flex -space-x-2 shrink-0">
                            {montage.installer && (
                                <Avatar className="h-6 w-6 border-2 border-background" title={`Montażysta: ${montage.installer.name}`}>
                                    <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        {initials(montage.installer.name || montage.installer.email)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            {montage.architect && (
                                <Avatar className="h-6 w-6 border-2 border-background" title={`Architekt: ${montage.architect.name}`}>
                                    <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                        {initials(montage.architect.name || montage.architect.email)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                             {montage.measurer && !montage.installer && (
                                <Avatar className="h-6 w-6 border-2 border-background" title={`Pomiarowiec: ${montage.measurer.name}`}>
                                    <AvatarFallback className="text-[9px] bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                        {initials(montage.measurer.name || montage.measurer.email)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>

                    {/* Location & Date */}
                    <div className="space-y-1.5">
                        {(addressLine || cityLine) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="truncate">
                                    {cityLine}{cityLine && addressLine ? ', ' : ''}{addressLine}
                                </span>
                            </div>
                        )}
                        
                        {(scheduledDate || forecastedDate) && (
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs rounded-md px-2 py-1 w-fit",
                                scheduledDate 
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" 
                                    : "bg-muted text-muted-foreground"
                            )}>
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span className="font-medium">
                                    {scheduledDate || `Szac: ${forecastedDate}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer: Stats & Actions */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            {/* Tasks */}
                            <div className={cn("flex items-center gap-1 text-[10px]", pendingTasksCount > 0 && "text-orange-600 font-medium")}>
                                <CheckSquare className="h-3 w-3" />
                                <span>{completedTasks}/{totalTasks}</span>
                            </div>
                            {/* Notes */}
                            {montage.notes.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px]">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{montage.notes.length}</span>
                                </div>
                            )}
                        </div>

                        {/* Contact Icons */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {/* Sample Status */}
                            {montage.sampleStatus && montage.sampleStatus !== 'none' && (
                                <div className={cn("flex items-center gap-1 text-[10px] mr-2", 
                                    montage.sampleStatus === 'to_send' && "text-amber-600 font-medium",
                                    montage.sampleStatus === 'returned' && "text-red-600 font-medium"
                                )} title={`Status próbek: ${montage.sampleStatus}`}>
                                    <span className="text-[10px]">📦</span>
                                    <span>
                                        {montage.sampleStatus === 'to_send' ? 'Do wysłania' : 
                                         montage.sampleStatus === 'sent' ? 'Wysłane' : 
                                         montage.sampleStatus === 'delivered' ? 'Dostarczone' :
                                         montage.sampleStatus === 'returned' ? 'Zwrócone' : ''}
                                    </span>
                                </div>
                            )}
                            {montage.contactPhone && (
                                <a href={`tel:${montage.contactPhone}`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={montage.contactPhone}>
                                    <Phone className="h-3 w-3" />
                                </a>
                            )}
                            {montage.contactEmail && (
                                <a href={`mailto:${montage.contactEmail}`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={montage.contactEmail}>
                                    <Mail className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </div>
                    
                    {/* Client Info Snippet */}
                    {hasClientInfo && (
                        <div className="text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded border border-border/30 line-clamp-1">
                            <span className="font-semibold mr-1">Info:</span>
                            {montage.clientInfo}
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    );
}
