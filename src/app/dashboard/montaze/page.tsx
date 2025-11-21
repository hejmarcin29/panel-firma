import { asc, desc } from 'drizzle-orm';

import Link from 'next/link';

import { MontagePipelineBoard } from './_components/montage-pipeline-board';
import { CreateMontageDialog } from './_components/create-montage-dialog';
import { statusOptions } from './constants';
import { formatRelativeDate, formatScheduleDate, mapMontageRow, type MontageRow } from './utils';
import type { Montage } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

export default async function MontazePage() {
    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const montageRows = await db.query.montages.findMany({
        orderBy: desc(montages.updatedAt),
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

    const montagesData: Montage[] = montageRows.map((row) => mapMontageRow(row as MontageRow, publicBaseUrl));

    const totalMontages = montagesData.length;
    const totalAttachments = montagesData.reduce((acc, montage) => acc + montage.attachments.length, 0);
    const totalTasks = montagesData.reduce((acc, montage) => acc + montage.tasks.length, 0);
    const completedTasks = montagesData.reduce(
        (acc, montage) => acc + montage.tasks.filter((task) => task.completed).length,
        0,
    );
    const openTasks = Math.max(totalTasks - completedTasks, 0);

    const parseTimestamp = (value: Montage['updatedAt']) => {
        if (!value) {
            return null;
        }

        const date = value instanceof Date
            ? value
            : typeof value === 'number'
                ? new Date(value)
                : new Date(value);

        const time = date.getTime();
        return Number.isNaN(time) ? null : time;
    };

    const montagesWithSchedule = montagesData
        .filter((montage) => Boolean(montage.scheduledInstallationAt))
        .sort((a, b) => {
            const aTime = a.scheduledInstallationAt ? new Date(a.scheduledInstallationAt).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.scheduledInstallationAt ? new Date(b.scheduledInstallationAt).getTime() : Number.POSITIVE_INFINITY;
            return aTime - bTime;
        });

    const unscheduledMontages = montagesData
        .filter((montage) => !montage.scheduledInstallationAt)
        .sort((a, b) => {
            const aTime = parseTimestamp(a.updatedAt) ?? parseTimestamp(a.createdAt) ?? Number.MAX_SAFE_INTEGER;
            const bTime = parseTimestamp(b.updatedAt) ?? parseTimestamp(b.createdAt) ?? Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        });

    const priorityList = [...montagesWithSchedule, ...unscheduledMontages].slice(0, 6);

    const tabs = [
        { id: 'kanban', label: 'Kanban' },
        { id: 'lista', label: 'Lista' },
        { id: 'kalendarz', label: 'Kalendarz' },
    ] as const;

    return (
        <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_240px] xl:grid-cols-[280px_minmax(0,1fr)_260px]">
                <aside className="space-y-3">
                    <Card className="border-border/70">
                        <CardHeader className="space-y-2 p-3">
                            <CardTitle className="text-sm font-semibold">Nowy montaż</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Dodaj szybko zapytanie od klienta i przypisz status startowy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <CreateMontageDialog />
                        </CardContent>
                    </Card>

                    <Card className="border-border/70">
                        <CardHeader className="space-y-2 p-3">
                            <CardTitle className="text-sm font-semibold">Filtry</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Zawęź listę według terminu, ekipy lub miasta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 pt-0">
                            <Input placeholder="Szukaj klienta" className="h-8 text-xs" />
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                                <Badge variant="secondary" className="px-2 py-1 text-[11px]">Wszystkie statusy</Badge>
                                <Badge variant="outline" className="px-2 py-1 text-[11px]">Do zaplanowania</Badge>
                                <Badge variant="outline" className="px-2 py-1 text-[11px]">W tym tygodniu</Badge>
                                <Badge variant="outline" className="px-2 py-1 text-[11px]">Wymaga reakcji</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70">
                        <CardHeader className="space-y-1 p-3">
                            <CardTitle className="text-sm font-semibold">Podsumowanie</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Krótkie metryki pipeline.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Aktywne montaże</span>
                                <span className="font-semibold text-foreground">{totalMontages}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Zadania otwarte</span>
                                <span className="font-semibold text-foreground">{openTasks}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Załączniki w R2</span>
                                <span className="font-semibold text-foreground">{totalAttachments}</span>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pipeline montaży</h2>
                            <p className="text-xs text-muted-foreground">
                                Zarządzaj etapami, przeciągając karty pomiędzy kolumnami.
                            </p>
                        </div>
                        <Tabs defaultValue="kanban" className="max-w-[220px]">
                            <TabsList className="grid grid-cols-3 rounded-md bg-muted/60 p-0.5">
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="px-2 py-1 text-[11px]"
                                        disabled={tab.id !== 'kanban'}
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <TabsContent value="kanban" className="mt-0">
                                <Card className="border-border/70">
                                    <CardContent className="space-y-3 p-3">
                                        <MontagePipelineBoard montages={montagesData} statusOptions={statusOptions} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="lista" className="mt-0 min-h-[120px]">
                                <Card className="border-dashed border-border/60">
                                    <CardContent className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
                                        Widok listy w przygotowaniu.
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="kalendarz" className="mt-0 min-h-[120px]">
                                <Card className="border-dashed border-border/60">
                                    <CardContent className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
                                        Widok kalendarza dostępny w kolejnej iteracji.
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>

                <aside className="space-y-3">
                    <Card className="border-border/70">
                        <CardHeader className="space-y-1 p-3">
                            <CardTitle className="text-sm font-semibold">Priorytety</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Najbliższe montaże i elementy wymagające uwagi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 pt-0 text-xs">
                            {priorityList.length === 0 ? (
                                <p className="text-muted-foreground">Brak aktywnych montaży.</p>
                            ) : (
                                priorityList.map((montage) => {
                                    const schedule = formatScheduleDate(montage.scheduledInstallationAt);
                                    const relative = formatRelativeDate(montage.updatedAt);
                                    return (
                                        <div key={montage.id} className="rounded-md border border-border/60 p-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-foreground line-clamp-1">{montage.clientName}</p>
                                                <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase">
                                                    {montage.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                                {schedule ? <span>Termin: {schedule}</span> : <span>Do zaplanowania</span>}
                                                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                                                <span>Aktualizacja: {relative}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span>{montage.tasks.filter((task) => !task.completed).length} otw. zadań</span>
                                                <Button asChild variant="link" className="h-auto px-0 text-[11px]">
                                                    <Link href={`/dashboard/montaze/${montage.id}`}>Szczegóły</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70">
                        <CardHeader className="space-y-1 p-3">
                            <CardTitle className="text-sm font-semibold">Przegląd kontaktów</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Ostatnio aktualizowane leady.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
                            {montagesData.slice(0, 4).map((montage) => (
                                <div key={montage.id} className="flex items-center justify-between">
                                    <span className="line-clamp-1 text-foreground">{montage.clientName}</span>
                                    <span>{formatRelativeDate(montage.updatedAt)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <Separator />

            <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                <p className="text-[11px] text-muted-foreground">
                    Wersja beta nowego panelu montaży. Zbieramy opinie dotyczące filtrów i widoku kalendarza.
                </p>
            </div>
        </div>
    );
}
