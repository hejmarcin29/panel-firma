import { asc, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { statusOptions } from '../constants';
import { mapMontageRow, type MontageRow } from '../utils';

import { MontageHeader } from './_components/montage-header';
import { MontageClientCard } from './_components/montage-client-card';
import { MontageMaterialCard } from './_components/montage-material-card';
import { MontageWorkflowTab } from './_components/montage-workflow-tab';
import { MontageTasksTab } from './_components/montage-tasks-tab';
import { MontageGalleryTab } from './_components/montage-gallery-tab';
import { MontageLogTab } from './_components/montage-log-tab';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

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

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageHeader montage={montage} statusOptions={statusOptions} />
            
            <main className="container mx-auto grid gap-6 p-4 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] lg:p-8">
                <div className="space-y-6">
                    <MontageClientCard montage={montage} />
                    <MontageMaterialCard montage={montage} />
                </div>

                <div className="space-y-6">
                    <Tabs defaultValue="workflow" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="workflow">Przebieg</TabsTrigger>
                            <TabsTrigger value="tasks">Zadania</TabsTrigger>
                            <TabsTrigger value="gallery">Galeria</TabsTrigger>
                            <TabsTrigger value="log">Dziennik</TabsTrigger>
                        </TabsList>
                        <TabsContent value="workflow" className="mt-6">
                            <MontageWorkflowTab montage={montage} />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-6">
                            <MontageTasksTab montage={montage} />
                        </TabsContent>
                        <TabsContent value="gallery" className="mt-6">
                            <MontageGalleryTab montage={montage} />
                        </TabsContent>
                        <TabsContent value="log" className="mt-6">
                            <MontageLogTab montage={montage} />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
