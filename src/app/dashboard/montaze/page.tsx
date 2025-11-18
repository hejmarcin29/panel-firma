import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';

import { MontagePipelineBoard } from './_components/montage-pipeline-board';
import { CreateMontageDialog } from './_components/create-montage-dialog';
import type { Montage } from './_components/montage-card';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    montageStatuses,
    montages,
    type MontageStatus,
} from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { tryGetR2Config } from '@/lib/r2/config';

const statusLabels: Record<MontageStatus, { label: string; description: string }> = {
    lead: {
        label: 'Lead',
        description: 'Nowe zapytanie, oczekuje na kontakt.',
    },
    before_measurement: {
        label: 'Przed pomiarem',
        description: 'Ustal termin i szczegoly pomiaru.',
    },
    before_first_payment: {
        label: 'Przed 1. wplata',
        description: 'Klient zaakceptowal wycene, czekamy na wplate.',
    },
    before_installation: {
        label: 'Przed montazem',
        description: 'Przygotuj ekipe i materialy do montazu.',
    },
    before_final_invoice: {
        label: 'Przed FV i protokolem',
        description: 'Czekamy na odbior, fakture koncowa i protokol.',
    },
};

const statusOptions = montageStatuses.map((value) => ({
    value,
    label: statusLabels[value].label,
    description: statusLabels[value].description,
}));

function normalizeAttachmentUrl(rawUrl: string, publicBaseUrl: string | null): string {
    if (!publicBaseUrl) {
        return rawUrl;
    }

    try {
        const candidate = new URL(rawUrl);
        const base = new URL(publicBaseUrl.endsWith('/') ? publicBaseUrl : `${publicBaseUrl}/`);

        const sameHost = candidate.host === base.host;
        const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
        const alreadyNormalized = sameHost && candidate.pathname.startsWith(basePath);
        if (alreadyNormalized) {
            return rawUrl;
        }

        const normalizedPath = candidate.pathname.replace(/^\/+/, '');
        const resolved = new URL(normalizedPath, base);
        resolved.search = candidate.search;
        resolved.hash = candidate.hash;
        return resolved.toString();
    } catch {
        return rawUrl;
    }
}

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

    const montagesData: Montage[] = montageRows.map((row) => {
        const billingAddress = row.billingAddress ?? row.address;
        const installationAddress = row.installationAddress ?? row.address;

        return {
        id: row.id,
        clientName: row.clientName,
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone,
        billingAddress: billingAddress,
        installationAddress: installationAddress,
        materialDetails: row.materialDetails,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        notes: row.notes.map((note) => ({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt,
            author: note.author
                ? {
                      id: note.author.id,
                      name: note.author.name ?? null,
                      email: note.author.email,
                  }
                : null,
            attachments: note.attachments?.map((attachment) => ({
                id: attachment.id,
                title: attachment.title ?? null,
                url: normalizeAttachmentUrl(attachment.url, publicBaseUrl),
                createdAt: attachment.createdAt,
                noteId: attachment.noteId ?? null,
                uploader: attachment.uploader
                    ? {
                          id: attachment.uploader.id,
                          name: attachment.uploader.name ?? null,
                          email: attachment.uploader.email,
                      }
                    : null,
            })) ?? [],
        })),
        checklistItems: row.checklistItems.map((item) => ({
            id: item.id,
            templateId: item.templateId,
            label: item.label,
            allowAttachment: Boolean(item.allowAttachment),
            completed: Boolean(item.completed),
            orderIndex: Number(item.orderIndex ?? 0),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            attachment: item.attachment
                ? {
                      id: item.attachment.id,
                      title: item.attachment.title ?? null,
                      url: normalizeAttachmentUrl(item.attachment.url, publicBaseUrl),
                      createdAt: item.attachment.createdAt,
                      noteId: item.attachment.noteId ?? null,
                      uploader: item.attachment.uploader
                          ? {
                                id: item.attachment.uploader.id,
                                name: item.attachment.uploader.name ?? null,
                                email: item.attachment.uploader.email,
                            }
                          : null,
                  }
                : null,
        })),
        attachments: row.attachments.map((attachment) => ({
            id: attachment.id,
            title: attachment.title ?? null,
            url: normalizeAttachmentUrl(attachment.url, publicBaseUrl),
            createdAt: attachment.createdAt,
            noteId: attachment.noteId ?? null,
            uploader: attachment.uploader
                ? {
                      id: attachment.uploader.id,
                      name: attachment.uploader.name ?? null,
                      email: attachment.uploader.email,
                  }
                : null,
        })),
        tasks: row.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            completed: Boolean(task.completed),
            updatedAt: task.updatedAt,
        })),
    };
    });

    const totalMontages = montagesData.length;
    const totalAttachments = montagesData.reduce((acc, montage) => acc + montage.attachments.length, 0);
    const totalTasks = montagesData.reduce((acc, montage) => acc + montage.tasks.length, 0);
    const completedTasks = montagesData.reduce(
        (acc, montage) => acc + montage.tasks.filter((task) => task.completed).length,
        0,
    );

    return (
        <div className="space-y-10">
            <section className="overflow-hidden rounded-3xl border bg-linear-to-br from-primary/5 via-background to-background p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Panel montaze 2025</h1>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Planowanie montazy, dokumentacja i komunikacja z klientem w jednym miejscu. Zarzadzaj pipeline, monitoruj postepy i zbieraj materialy bezposrednio w chmurze R2.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Pliki trafiaja do Cloudflare R2 – <Link className="text-primary hover:underline" href="/dashboard/montaze/galeria">otworz galerie</Link>, aby zobaczyc wszystkie materialy.
                            </p>
                        </div>
                        <CreateMontageDialog />
                    </div>
                    <div className="grid gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Pipeline status</span>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">{totalMontages} montazy</Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
                                {completedTasks}/{totalTasks} zadan zakonczonych
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">{totalAttachments} plikow w R2</Badge>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pipeline montazy</h2>
                    <p className="text-xs text-muted-foreground">
                        Organizuj montaze wedlug statusu i otwieraj panel, aby dodac notatki, zadania lub pliki.
                    </p>
                </div>
                <Separator />
                <MontagePipelineBoard montages={montagesData} statusOptions={statusOptions} />
            </section>
        </div>
    );
}
