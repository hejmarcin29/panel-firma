import { asc, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    systemLogs,
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
import { MontageLogTab } from './_components/montage-log-tab';
import { MontageMeasurementTab } from '../_components/montage-measurement-tab';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MontageDetailsPage({ params, searchParams }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const { tab } = await searchParams;
    const activeTab = typeof tab === 'string' ? tab : 'log';

    const user = await requireUser();

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

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageHeader montage={montage} statusOptions={statusOptions} userRole={user.role} />
            
            <main className="container mx-auto grid gap-6 p-4 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] lg:p-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-6">
                    <MontageClientCard montage={montage} userRole={user.role} />
                    <MontageMaterialCard montage={montage} userRole={user.role} />
                </div>

                <div className="space-y-6">
                    <Tabs defaultValue={activeTab} className="w-full">
                        <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5">
                            <TabsTrigger value="log" className="flex-1">Dziennik</TabsTrigger>
                            <TabsTrigger value="workflow" className="flex-1">Przebieg</TabsTrigger>
                            <TabsTrigger value="measurement" className="flex-1">Pomiar</TabsTrigger>
                            <TabsTrigger value="tasks" className="flex-1">Zadania</TabsTrigger>
                            <TabsTrigger value="gallery" className="flex-1">Załączniki</TabsTrigger>
                        </TabsList>
                        <TabsContent value="log" className="mt-6">
                            <MontageLogTab montage={montage} logs={logs} />
                        </TabsContent>
                        <TabsContent value="workflow" className="mt-6">
                            <MontageWorkflowTab montage={montage} statusOptions={statusOptions} />
                        </TabsContent>
                        <TabsContent value="measurement" className="mt-6">
                            <MontageMeasurementTab montage={montage} />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-6">
                            <MontageTasksTab montage={montage} />
                        </TabsContent>
                        <TabsContent value="gallery" className="mt-6">
                            <MontageGalleryTab montage={montage} />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
