import { asc, desc, eq, and, inArray, or } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

import { MontageDashboardView } from './_components/montage-dashboard-view';
import { InstallerDashboardView } from './_components/installer-dashboard-view';
import { MontageViewTabs, MontageStageFilters } from './_components/montage-view-switcher';
import { mapMontageRow, type MontageRow } from './utils';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    montages,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

type MontageView = 'lead' | 'in-progress' | 'done';

type InProgressStage =
    | 'all'
    | 'before-measure'
    | 'before-first-payment'
    | 'before-install'
    | 'before-invoice';

// Using a generic props type here because Next's generated
// PageProps for this project treat searchParams as a Promise.
// We normalise it inside the function instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function MontazePage(props: any) {
    const searchParams = (await props.searchParams) as
        | { view?: string; stage?: string }
        | undefined;
    const user = await requireUser();
    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const kpiMontageThreatDays = await getAppSetting(appSettingKeys.kpiMontageThreatDays);
    const threatDays = Number(kpiMontageThreatDays ?? 7);

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusOptions = statusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

    const view: MontageView =
        searchParams?.view === 'lead' ||
        searchParams?.view === 'done' ||
        searchParams?.view === 'in-progress'
            ? searchParams.view
            : 'in-progress';

    const stage: InProgressStage =
        searchParams?.stage === 'before-measure' ||
        searchParams?.stage === 'before-first-payment' ||
        searchParams?.stage === 'before-install' ||
        searchParams?.stage === 'before-invoice' ||
        searchParams?.stage === 'all'
            ? searchParams.stage
            : 'all';

    const conditions: (ReturnType<typeof eq> | ReturnType<typeof inArray>)[] = [];

    // Special logic for installers: they see everything assigned to them
    const isOnlyInstaller = user.roles.includes('installer') && !user.roles.includes('admin') && !user.roles.includes('measurer');

    if (isOnlyInstaller) {
        conditions.push(eq(montages.installerId, user.id));
    } else {
        // Standard logic for other roles
        if (!user.roles.includes('admin')) {
             const userFilters = [];
             if (user.roles.includes('installer')) userFilters.push(eq(montages.installerId, user.id));
             if (user.roles.includes('measurer')) userFilters.push(eq(montages.measurerId, user.id));
             
             if (userFilters.length > 0) {
                 const filter = or(...userFilters);
                 if (filter) conditions.push(filter);
             }
        }

        if (view === 'lead') {
            conditions.push(eq(montages.status, 'lead'));
        } else if (view === 'done') {
            conditions.push(eq(montages.status, 'completed'));
        } else {
            const inProgressStatuses = [
                'before_measurement',
                'before_first_payment',
                'before_installation',
                'before_final_invoice',
            ];

            let filteredStatuses = inProgressStatuses;
            if (stage !== 'all') {
                if (stage === 'before-measure') filteredStatuses = ['before_measurement'];
                if (stage === 'before-first-payment') filteredStatuses = ['before_first_payment'];
                if (stage === 'before-install') filteredStatuses = ['before_installation'];
                if (stage === 'before-invoice') filteredStatuses = ['before_final_invoice'];
            }

            conditions.push(inArray(montages.status, filteredStatuses));
        }
    }

    const montageRows = await db.query.montages.findMany({
        where: conditions.length ? and(...conditions) : undefined,
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
            installer: true,
            measurer: true,
        },
    });

    const montagesList = montageRows.map(row => mapMontageRow(row as MontageRow, publicBaseUrl));

    // Ensure all used statuses are in statusOptions
    const usedStatuses = new Set(montagesList.map(m => m.status));
    const definedStatuses = new Set(statusOptions.map(s => s.value));
    
    for (const status of usedStatuses) {
        if (!definedStatuses.has(status)) {
            statusOptions.push({
                value: status,
                label: status, // Fallback label
                description: 'Status usunięty lub nieznany'
            });
        }
    }

    if (isOnlyInstaller) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
                <InstallerDashboardView montages={montagesList} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10">
                <div className="flex flex-col md:flex-row md:h-16 md:items-center px-4 py-3 md:py-0 sm:px-6 justify-between gap-3 md:gap-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold">Centrum Montaży</h1>
                        <div className="md:hidden">
                            <Button asChild size="sm" className="h-8 w-8 p-0 rounded-full">
                                <Link href="/dashboard/montaze/nowy">
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">Dodaj</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <MontageViewTabs />
                </div>
                <MontageStageFilters />
            </div>
            <div className="flex-1 overflow-hidden md:py-6">
                <MontageDashboardView 
                    montages={montagesList} 
                    statusOptions={statusOptions}
                    threatDays={threatDays}
                    headerAction={
                        <Button asChild>
                            <Link href="/dashboard/montaze/nowy">
                                <Plus className="mr-2 h-4 w-4" />
                                Dodaj montaż
                            </Link>
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
