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
import { MontageLogTab } from './_components/montage-log-tab';
import { MontageMeasurementTab } from '../_components/montage-measurement-tab';
import { MontageTechnicalTab } from './_components/montage-technical-tab';
import { MontageQuotes } from './_components/montage-quotes';

import { MontageDetailsLayout } from './_components/montage-details-layout';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

import { like } from 'drizzle-orm';
import { users } from '@/lib/db/schema';

export default async function MontageDetailsPage({ params, searchParams }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const { tab } = await searchParams;
    const activeTab = typeof tab === 'string' ? tab : 'log';

    const user = await requireUser();

    const installers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(like(users.roles, '%"installer"%'));
    const measurers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(like(users.roles, '%"measurer"%'));

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

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageDetailsLayout 
                header={<MontageHeader montage={montage} statusOptions={statusOptions} userRoles={user.roles} />}
                clientCard={<MontageClientCard montage={montage} userRoles={user.roles} />}
                materialCard={<MontageMaterialCard montage={montage} userRoles={user.roles} />}
                defaultTab={activeTab}
                tabs={{
                    log: <MontageLogTab montage={montage} logs={logs} />,
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
