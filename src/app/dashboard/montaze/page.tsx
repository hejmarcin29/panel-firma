import { asc, desc, eq, and, inArray, or } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
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
    const isOnlyArchitect = user.roles.includes('architect') && !user.roles.includes('admin');

    if (isOnlyInstaller) {
        conditions.push(eq(montages.installerId, user.id));
    } else if (isOnlyArchitect) {
        conditions.push(eq(montages.architectId, user.id));
    } else {
        // Standard logic for other roles
        if (!user.roles.includes('admin')) {
             const userFilters = [];
             if (user.roles.includes('installer')) userFilters.push(eq(montages.installerId, user.id));
             if (user.roles.includes('measurer')) userFilters.push(eq(montages.measurerId, user.id));
             if (user.roles.includes('architect')) userFilters.push(eq(montages.architectId, user.id));
             
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
            architect: true,
            quotes: true,
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

    // Filter status options based on view to show only relevant columns on the board
    let filteredStatusOptions = statusOptions;
    if (view === 'lead') {
        filteredStatusOptions = statusOptions.filter(s => s.value === 'lead');
    } else if (view === 'done') {
        filteredStatusOptions = statusOptions.filter(s => s.value === 'completed');
    } else {
        // In-progress view
        if (stage !== 'all') {
             const statusMap: Record<string, string> = {
                'before-measure': 'before_measurement',
                'before-first-payment': 'before_first_payment',
                'before-install': 'before_installation',
                'before-invoice': 'before_final_invoice'
            };
            const targetStatus = statusMap[stage];
            filteredStatusOptions = statusOptions.filter(s => s.value === targetStatus);
        } else {
            filteredStatusOptions = statusOptions.filter(s => s.value !== 'lead' && s.value !== 'completed');
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
                        <div className="flex items-center gap-2 md:hidden">
                            <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                                <Link href="/dashboard/montaze/ekipy">
                                    <span className="sr-only">Ekipy</span>
                                    <Users className="h-4 w-4" />
                                </Link>
                            </Button>
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
                    statusOptions={filteredStatusOptions}
                    threatDays={threatDays}
                    headerAction={
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href="/dashboard/montaze/ekipy">
                                    <Users className="mr-2 h-4 w-4" />
                                    Baza Ekip
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/montaze/nowy">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Dodaj montaż
                                </Link>
                            </Button>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
