import { asc, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    systemLogs,
    quotes,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';

import { mapMontageRow, type MontageRow } from '../utils';

import { MontageHeader } from './_components/montage-header';
import { MontageClientCard } from './_components/montage-client-card';
import { MontageMaterialCard } from './_components/montage-material-card';
import { MontageWorkflowTab } from './_components/montage-workflow-tab';
import { MontageTasksTab } from './_components/montage-tasks-tab';
import { MontageGalleryTab } from './_components/montage-gallery-tab';
import { MontageNotesTab } from './_components/montage-notes-tab';
import { MontageHistoryTab } from './_components/montage-history-tab';
import { MontageMeasurementTab } from '../_components/montage-measurement-tab';
import { MontageTechnicalTab } from './_components/montage-technical-tab';
import { MontageQuotes } from './_components/montage-quotes';

import { MontageDetailsLayout } from './_components/montage-details-layout';
import { ConvertLeadButton } from './_components/convert-lead-button';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MontageDetailsPage({ params, searchParams }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const { tab } = await searchParams;
    const activeTab = typeof tab === 'string' ? tab : 'notes';

    const user = await requireUser();

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
        }
    });
    
    const installers = allUsers.filter(u => u.roles?.includes('installer') || u.roles?.includes('admin'));
    const measurers = allUsers.filter(u => u.roles?.includes('measurer') || u.roles?.includes('admin'));
    const architects = allUsers.filter(u => u.roles?.includes('architect'));

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusOptions = statusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

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
                with: {
                    attachments: true,
                },
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
            installer: true,
            measurer: true,
            architect: true,
            quotes: {
                orderBy: desc(quotes.createdAt),
            },
        },
    });

    if (!montageRow) {
        notFound();
    }

    const logs = await db
        .select()
        .from(systemLogs)
        .where(sql`${systemLogs.details} LIKE ${`%${montageId}%`}`)
        .orderBy(desc(systemLogs.createdAt));

    const montage = mapMontageRow(montageRow as MontageRow, publicBaseUrl);

    if (montage.status === 'lead') {
        return (
             <div className="flex min-h-screen flex-col bg-muted/10">
                <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{montage.clientName}</h1>
                            <p className="text-muted-foreground">Nowy Lead - Weryfikacja</p>
                        </div>
                        <ConvertLeadButton montageId={montage.id} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <MontageClientCard montage={montage} userRoles={user.roles} installers={installers} measurers={measurers} architects={architects} />
                        <div className="space-y-6">
                             <div className="bg-card rounded-xl border shadow-sm p-6">
                                <h3 className="font-semibold mb-4">Notatki</h3>
                                <MontageNotesTab montage={montage} />
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageDetailsLayout 
                header={<MontageHeader montage={montage} statusOptions={statusOptions} userRoles={user.roles} />}
                clientCard={<MontageClientCard montage={montage} userRoles={user.roles} installers={installers} measurers={measurers} architects={architects} />}
                materialCard={
                    <div className="space-y-6">
                        {/* Client Requirements (Lead) */}
                        {montage.materialDetails && (
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="p-6 pt-6">
                                    <h3 className="font-semibold leading-none tracking-tight mb-4">Info od klienta</h3>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {montage.materialDetails}
                                    </div>
                                </div>
                            </div>
                        )}

                        <MontageMaterialCard montage={montage} userRoles={user.roles} />
                    </div>
                }
                defaultTab={activeTab}
                tabs={{
                    notes: <MontageNotesTab montage={montage} />,
                    history: <MontageHistoryTab montage={montage} logs={logs} />,
                    workflow: <MontageWorkflowTab montage={montage} statusOptions={statusOptions} installers={installers} measurers={measurers} />,
                    measurement: <MontageMeasurementTab montage={montage} />,
                    technical: <MontageTechnicalTab montage={montage} userRoles={user.roles} />,
                    quotes: <MontageQuotes montageId={montage.id} quotes={montage.quotes} />,
                    tasks: <MontageTasksTab montage={montage} />,
                    gallery: <MontageGalleryTab montage={montage} />,
                }}
            />
        </div>
    );
}
