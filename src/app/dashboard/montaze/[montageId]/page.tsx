import { asc, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { MontageCard } from '../_components/montage-card';
import { statusOptions } from '../constants';
import type { Montage } from '../types';
import { formatScheduleDate, formatRelativeDate, mapMontageRow, summarizeMaterialDetails, type MontageRow } from '../utils';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

function buildSummary(montage: Montage) {
    const totalTasks = montage.tasks.length;
    const completedTasks = montage.tasks.filter((task) => task.completed).length;
    const openTasks = Math.max(totalTasks - completedTasks, 0);
    const materialsSummary = summarizeMaterialDetails(montage.materialDetails, 120);

    return [
        {
            label: 'Status',
            value: montage.status,
        },
        {
            label: 'Aktualizacja',
            value: formatRelativeDate(montage.updatedAt),
        },
        {
            label: 'Termin',
            value: formatScheduleDate(montage.scheduledInstallationAt) ?? 'Brak',
        },
        {
            label: 'Zadania otwarte',
            value: String(openTasks),
        },
        {
            label: 'Materiały',
            value: materialsSummary,
        },
    ];
}

export default async function MontageDetailsPage({ params }: MontageDetailsPageParams) {
    const { montageId } = await params;

    await requireUser();

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const montageRow = await db.query.montages.findFirst({
        where: (table, { eq }) => eq(table.id, montageId),
        with: {
            notes: {
                orderBy: desc(montageNotes.createdAt),
                with: {
                    author: true,
                    attachments: {
                        orderBy: desc(montageAttachments.createdAt),
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            tasks: {
                orderBy: asc(montageTasks.createdAt),
            },
            checklistItems: {
                orderBy: asc(montageChecklistItems.orderIndex),
                with: {
                    attachment: {
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            attachments: {
                orderBy: desc(montageAttachments.createdAt),
                with: {
                    uploader: true,
                },
            },
        },
    });

    if (!montageRow) {
        notFound();
    }

    const montage = mapMontageRow(montageRow as MontageRow, publicBaseUrl);
    const summary = buildSummary(montage);

    return (
        <section className="mx-auto w-full max-w-[920px] space-y-4 px-3 pb-8 sm:px-6">
            <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                    <Link href="/dashboard/montaze">Powrót</Link>
                </Button>
            </div>

            <Card className="border-border/70">
                <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-sm font-semibold">Szybkie informacje</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 py-0 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="space-y-1 text-foreground">
                        <p className="font-semibold">{montage.clientName}</p>
                        {montage.installationAddress ? (
                            <p className="text-xs text-muted-foreground">{montage.installationAddress}</p>
                        ) : null}
                        {montage.installationCity ? (
                            <p className="text-xs text-muted-foreground">{montage.installationCity}</p>
                        ) : null}
                        <div className="mt-1 space-y-1">
                            {montage.contactPhone ? <p className="text-xs">tel. {montage.contactPhone}</p> : null}
                            {montage.contactEmail ? <p className="text-xs">{montage.contactEmail}</p> : null}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {summary.map((item) => (
                            <div key={item.label} className="space-y-0.5">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-semibold text-foreground leading-snug">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <MontageCard montage={montage} statusOptions={statusOptions} />
        </section>
    );
}
