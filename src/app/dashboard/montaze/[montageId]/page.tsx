import { asc, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { formatScheduleDate, formatRelativeDate, mapMontageRow, type MontageRow } from '../utils';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

function buildSummary(montage: Montage) {
    const totalTasks = montage.tasks.length;
    const completedTasks = montage.tasks.filter((task) => task.completed).length;
    const openTasks = Math.max(totalTasks - completedTasks, 0);

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
            label: 'Załączniki',
            value: String(montage.attachments.length),
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
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                    <Link href="/dashboard/montaze">Powrót</Link>
                </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                <div className="space-y-4">
                    <MontageCard montage={montage} statusOptions={statusOptions} />
                </div>
                <aside className="space-y-3">
                    <Card className="border-border/70">
                        <CardHeader className="space-y-1 py-3">
                            <CardTitle className="text-sm font-semibold">Klient</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 py-0 text-xs text-muted-foreground">
                            <div className="space-y-1 text-foreground">
                                <p className="font-semibold">{montage.clientName}</p>
                                {montage.installationAddress ? (
                                    <p className="text-xs text-muted-foreground">{montage.installationAddress}</p>
                                ) : null}
                                {montage.installationCity ? (
                                    <p className="text-xs text-muted-foreground">{montage.installationCity}</p>
                                ) : null}
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                                {montage.contactPhone ? <p>tel. {montage.contactPhone}</p> : null}
                                {montage.contactEmail ? <p>{montage.contactEmail}</p> : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70">
                        <CardHeader className="space-y-1 py-3">
                            <CardTitle className="text-sm font-semibold">Podsumowanie</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 py-0 text-xs text-muted-foreground">
                            {summary.map((item) => (
                                <div key={item.label} className="flex items-center justify-between text-xs">
                                    <span>{item.label}</span>
                                    <span className="font-semibold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </section>
    );
}
