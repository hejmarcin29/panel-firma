'use client';

import { useMemo } from 'react';
import { Phone, Mail, MapPin, CheckSquare, Hammer, User } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { Montage, StatusOption } from '../types';
import { summarizeMaterialDetails, formatScheduleRange } from '../utils';

function countCompleted(tasks: Montage['tasks']): number {
	return tasks.filter((task) => task.completed).length;
}

function formatTimestamp(value: Montage['updatedAt']) {
	if (!value) {
		return 'brak danych';
	}

	const date = value instanceof Date ? value : new Date(Number(value));
	if (Number.isNaN(date.getTime())) {
		return 'brak danych';
	}

	return new Intl.RelativeTimeFormat('pl', { numeric: 'auto' }).format(
		Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
		'day',
	);
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
};

export function MontagePipelineCard({ montage, threatDays }: Props) {
	const completedTasks = useMemo(() => countCompleted(montage.tasks), [montage.tasks]);
	const totalTasks = montage.tasks.length;
	const materialsSummary = useMemo(
		() => summarizeMaterialDetails(montage.materialDetails, 72),
		[montage.materialDetails],
	);
	const hasMaterials = Boolean(montage.materialDetails?.trim());
	const latestUpdate = formatTimestamp(montage.updatedAt);
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
        return diffDays >= 0 && diffDays <= threatDays;
    }, [montage.scheduledInstallationAt, montage.forecastedInstallationDate, montage.status, threatDays]);

    return (
        <Link href={`/dashboard/montaze/${montage.id}`} className="block group">
            <Card className={`w-full border border-border/60 bg-linear-to-br from-background via-background to-muted/30 shadow-sm transition-all hover:shadow-md hover:border-primary/20 ${isThreatened ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                <CardHeader className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {initials(montage.clientName)}
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-sm font-semibold leading-tight text-foreground">
                                    {montage.clientName}
                                </CardTitle>
                                <div className="flex flex-col gap-0.5">
                                    {montage.displayId && (
                                        <span className="text-[10px] font-medium text-primary/80">{montage.displayId}</span>
                                    )}
                                    <CardDescription className="text-[10px] text-muted-foreground">Aktualizacja: {latestUpdate}</CardDescription>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {isThreatened && (
                                <Badge variant="destructive" className="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-normal animate-pulse">
                                    Zagrożony
                                </Badge>
                            )}
                            {hasMaterials && (
                                <Badge variant="secondary" className="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-normal">
                                    materiały
                                </Badge>
                            )}
                            {pendingTasksCount > 0 && (
                                <Badge variant="destructive" className="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-normal flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    {pendingTasksCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {(addressLine || cityLine) && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            <div className="line-clamp-2">
                                {addressLine}{cityLine ? `, ${cityLine}` : ''}
                            </div>
                        </div>
                    )}

                    {(montage.installer || montage.measurer) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            {montage.installer && (
                                <div className="flex items-center gap-1.5" title={`Montażysta: ${montage.installer.name || montage.installer.email}`}>
                                    <Hammer className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-[100px]">{initials(montage.installer.name || montage.installer.email)}</span>
                                </div>
                            )}
                            {montage.measurer && (
                                <div className="flex items-center gap-1.5" title={`Pomiarowiec: ${montage.measurer.name || montage.measurer.email}`}>
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-[100px]">{initials(montage.measurer.name || montage.measurer.email)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                    {(montage.contactPhone || montage.contactEmail) && (
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            {montage.contactPhone && (
                                <a href={`tel:${montage.contactPhone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Phone className="h-3 w-3" />
                                    {montage.contactPhone}
                                </a>
                            )}
                            {montage.contactEmail && (
                                <a href={`mailto:${montage.contactEmail}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{montage.contactEmail}</span>
                                </a>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                            {totalTasks === 0 ? 'Brak zadań' : `${completedTasks}/${totalTasks} zad.`}
                        </Badge>
                        <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                            {montage.notes.length} not.
                        </Badge>
                        {(scheduledDate || forecastedDate) && (
                            <Badge variant="outline" className={cn(
                                "rounded-md px-1.5 py-0 text-[10px] font-normal",
                                scheduledDate ? "text-blue-600 bg-blue-50/50 border-blue-100" : "text-muted-foreground bg-muted/50 border-border italic"
                            )}>
                                {scheduledDate || `Szac: ${forecastedDate}`}
                            </Badge>
                        )}
                    </div>

                    {hasMaterials && (
                        <>
                            <Separator className="bg-border/50" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Materiały</p>
                                <p className="line-clamp-2 text-xs text-foreground/80">{materialsSummary}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </Link>
	);
}
