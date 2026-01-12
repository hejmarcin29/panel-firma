import { asc, desc, eq, and, inArray, or, sql, isNull, type SQL } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

import { MontageDashboardView } from './_components/montage-dashboard-view';
import { InstallerDashboardView } from './_components/installer-dashboard-view';
import { MontageSortSelect } from './_components/montage-sort-select';
import { AddLeadModal } from './_components/add-lead-modal';
import { mapMontageRow, type MontageRow } from './utils';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    montages,
    type MontageStatus,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { SORT_OPTIONS, type SortOption } from './constants';

type MontageView = 'lead' | 'in-progress' | 'done' | 'rejected';

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
        | { view?: string; stage?: string; sort?: string; filter?: string }
        | undefined;
    const user = await requireUser();
    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const kpiMontageThreatDays = await getAppSetting(appSettingKeys.kpiMontageThreatDays);
    const threatDays = Number(kpiMontageThreatDays ?? 7);

    const kpiAlertMissingMaterialStatusDays = await getAppSetting(appSettingKeys.kpiAlertMissingMaterialStatusDays);
    const missingMaterialStatusDays = Number(kpiAlertMissingMaterialStatusDays ?? 7);

    const kpiAlertMissingInstallerStatusDays = await getAppSetting(appSettingKeys.kpiAlertMissingInstallerStatusDays);
    const missingInstallerStatusDays = Number(kpiAlertMissingInstallerStatusDays ?? 7);

    const kpiAlertMissingMeasurerDays = await getAppSetting(appSettingKeys.kpiAlertMissingMeasurerDays);
    const missingMeasurerDays = Number(kpiAlertMissingMeasurerDays ?? 14);

    const kpiAlertMissingInstallerDays = await getAppSetting(appSettingKeys.kpiAlertMissingInstallerDays);
    const missingInstallerDays = Number(kpiAlertMissingInstallerDays ?? 14);

    const kpiAlertMaterialOrderedDays = await getAppSetting(appSettingKeys.kpiAlertMaterialOrderedDays);
    const materialOrderedDays = Number(kpiAlertMaterialOrderedDays ?? 5);

    const kpiAlertMaterialInstockDays = await getAppSetting(appSettingKeys.kpiAlertMaterialInstockDays);
    const materialInstockDays = Number(kpiAlertMaterialInstockDays ?? 2);

    const alertSettings = {
        missingMaterialStatusDays,
        missingInstallerStatusDays,
        missingMeasurerDays,
        missingInstallerDays,
        materialOrderedDays,
        materialInstockDays
    };

    const statusDefinitions = await getMontageStatusDefinitions();
    let statusOptions = statusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

    const view: MontageView =
        searchParams?.view === 'lead' ||
        searchParams?.view === 'done' ||
        searchParams?.view === 'in-progress' ||
        searchParams?.view === 'rejected'
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

    const sort = (searchParams?.sort as SortOption) || SORT_OPTIONS.LAST_ACTIVITY;

    const conditions: (SQL | undefined)[] = [
        isNull(montages.deletedAt)
    ];

    // Special logic for installers: they see everything assigned to them
    const isOnlyInstaller = user.roles.includes('installer') && !user.roles.includes('admin');
    const isOnlyArchitect = user.roles.includes('architect') && !user.roles.includes('admin');

    if (isOnlyInstaller) {
        conditions.push(or(eq(montages.installerId, user.id), eq(montages.measurerId, user.id)));
    } else if (isOnlyArchitect) {
        conditions.push(eq(montages.architectId, user.id));
    } else if (!user.roles.includes('admin')) {
        // Standard logic for other roles
         const userFilters = [];
         if (user.roles.includes('installer')) {
             userFilters.push(eq(montages.installerId, user.id));
             userFilters.push(eq(montages.measurerId, user.id));
         }
         if (user.roles.includes('architect')) userFilters.push(eq(montages.architectId, user.id));
         
         if (userFilters.length > 0) {
             const filter = or(...userFilters);
             if (filter) conditions.push(filter);
         }
    }

    if (!isOnlyInstaller) {
        if (searchParams?.filter === 'urgent') {
            // KPI: Wiszące montaże (bez daty, nie lead, nie zakończone)
            conditions.push(
                and(
                    sql`${montages.status} != 'new_lead'`,
                    sql`${montages.status} != 'completed'`,
                    isNull(montages.scheduledInstallationAt)
                )
            );
        } else if (searchParams?.filter === 'payments') {
            // KPI: Nierozliczone montaże
            conditions.push(inArray(montages.status, ['waiting_for_deposit', 'final_settlement']));
        } else if (view === 'lead') {
            conditions.push(inArray(montages.status, [
                'new_lead',
                'lead_contact',
                'lead_samples_pending',
                'lead_samples_sent',
                'lead_pre_estimate'
            ]));
        } else if (view === 'done') {
            conditions.push(eq(montages.status, 'completed'));
        } else if (view === 'rejected') {
            conditions.push(inArray(montages.status, ['on_hold', 'rejected']));
        } else {
            const inProgressStatuses: MontageStatus[] = [
                'measurement_to_schedule',
                'measurement_scheduled',
                'measurement_done',
                'quote_in_progress',
                'quote_sent',
                'quote_accepted',
                'contract_signed',
                'waiting_for_deposit',
                'deposit_paid',
                'materials_ordered',
                'materials_pickup_ready',
                'installation_scheduled',
                'materials_delivered',
                'installation_in_progress',
                'protocol_signed',
                'final_invoice_issued',
                'final_settlement',
            ];

            let filteredStatuses = inProgressStatuses;
            if (stage !== 'all') {
                if (stage === 'before-measure') filteredStatuses = ['measurement_to_schedule', 'measurement_scheduled'];
                if (stage === 'before-first-payment') filteredStatuses = ['measurement_done', 'quote_in_progress', 'quote_sent', 'quote_accepted', 'contract_signed', 'waiting_for_deposit'];
                if (stage === 'before-install') filteredStatuses = ['deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled', 'materials_delivered'];
                if (stage === 'before-invoice') filteredStatuses = ['installation_in_progress', 'protocol_signed', 'final_invoice_issued', 'final_settlement'];
            }

            conditions.push(inArray(montages.status, filteredStatuses));
        }
    }

    let orderByClause;
    
    // Filter status options based on view
    if (view === 'lead') {
        const leadStatuses = [
             'new_lead',
             'lead_contact',
             'lead_samples_pending',
             'lead_samples_sent',
             'lead_pre_estimate'
        ];
        statusOptions = statusOptions.filter(s => leadStatuses.includes(s.value));
    } else if (view === 'done') {
        statusOptions = statusOptions.filter(s => s.value === 'completed');
    } else if (view === 'rejected') {
        statusOptions = statusOptions.filter(s => ['on_hold', 'rejected'].includes(s.value));
    } else {
         // In Progress view
         if (stage !== 'all') {
             // If a specific stage is selected, filter status options accordingly
             let filteredStatuses: MontageStatus[] = [];
             if (stage === 'before-measure') filteredStatuses = ['measurement_to_schedule', 'measurement_scheduled']; // Updated to include 'To Schedule' as it leads to measure
             if (stage === 'before-first-payment') filteredStatuses = ['measurement_done', 'quote_in_progress', 'quote_sent', 'quote_accepted', 'contract_signed', 'waiting_for_deposit'];
             if (stage === 'before-install') filteredStatuses = ['deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled', 'materials_delivered'];
             if (stage === 'before-invoice') filteredStatuses = ['installation_in_progress', 'protocol_signed', 'final_invoice_issued', 'final_settlement'];

            // If we have a stage, we likely want to see that pipeline slice
            if (filteredStatuses.length > 0) {
                 statusOptions = statusOptions.filter(s => filteredStatuses.includes(s.value as MontageStatus));
            }
         } else {
             // Show all In-Progress statuses
             const inProgressStatuses = [
                'measurement_to_schedule',
                'measurement_scheduled',
                'measurement_done',
                'quote_in_progress',
                'quote_sent',
                'quote_accepted',
                'contract_signed',
                'waiting_for_deposit',
                'deposit_paid',
                'materials_ordered',
                'materials_pickup_ready',
                'installation_scheduled',
                'materials_delivered',
                'installation_in_progress',
                'protocol_signed',
                'final_invoice_issued',
                'final_settlement',
                'complaint'
             ];
             statusOptions = statusOptions.filter(s => inProgressStatuses.includes(s.value));
         }
    }

    if (sort === SORT_OPTIONS.SMART_DATE) {
        orderByClause = [
            asc(sql`COALESCE(${montages.scheduledInstallationAt}, ${montages.forecastedInstallationDate})`),
            desc(montages.createdAt)
        ];
    } else if (sort === SORT_OPTIONS.STAGNATION) {
        orderByClause = asc(montages.updatedAt);
    } else {
        orderByClause = desc(montages.updatedAt);
    }

    const montageRows = await db.query.montages.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: orderByClause,
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
    // Fetch new leads count for navigation badge
    const newLeadsCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(montages)
        .where(and(eq(montages.status, 'new_lead'), isNull(montages.deletedAt)));
    const newLeadsCount = Number(newLeadsCountRes[0]?.count ?? 0);
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

    // Filter statuses for Installer (restrict columns)
    if (isOnlyInstaller) {
        const installerVisibleStatuses: MontageStatus[] = [
            'measurement_to_schedule',
            'measurement_scheduled',
            'measurement_done',
            'installation_scheduled',
            'installation_in_progress',
            'protocol_signed',
        ];
        statusOptions = statusOptions.filter(s => installerVisibleStatuses.includes(s.value as MontageStatus));
    }

    // Filter statuses for Architect (restrict columns)
    if (isOnlyArchitect) {
        const architectVisibleStatuses: MontageStatus[] = [
             'new_lead',
             'measurement_scheduled',
             'quote_sent', 
             'quote_accepted',
             'contract_signed',
             'installation_scheduled',
             'installation_in_progress',
             'completed'
        ];
        statusOptions = statusOptions.filter(s => architectVisibleStatuses.includes(s.value as MontageStatus));
    }

    // Filter status options based on view to show only relevant columns on the board
    let filteredStatusOptions = statusOptions;
    if (view === 'lead') {
        filteredStatusOptions = statusOptions.filter(s => 
            [
                'new_lead', 
                'lead_contact', 
                'lead_samples_pending', 
                'lead_samples_sent', 
                'lead_pre_estimate',
                'measurement_to_schedule'
            ].includes(s.value)
        );
    } else if (view === 'done') {
        filteredStatusOptions = statusOptions.filter(s => s.value === 'completed');
    } else {
        // In-progress view
        if (stage !== 'all') {
             const statusMap: Record<string, string[]> = {
                'before-measure': ['measurement_to_schedule', 'measurement_scheduled'],
                'before-first-payment': ['measurement_done', 'quote_in_progress', 'quote_sent', 'quote_accepted', 'contract_signed', 'waiting_for_deposit'],
                'before-install': ['deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled', 'materials_delivered'],
                'before-invoice': ['installation_in_progress', 'protocol_signed', 'final_invoice_issued', 'final_settlement']
            };
            const targetStatuses = statusMap[stage] || [];
            filteredStatusOptions = statusOptions.filter(s => targetStatuses.includes(s.value));
        } else {
            const inProgressStatuses = [
                'measurement_to_schedule',
                'measurement_scheduled',
                'measurement_done',
                'quote_in_progress',
                'quote_sent',
                'quote_accepted',
                'contract_signed',
                'waiting_for_deposit',
                'deposit_paid',
                'materials_ordered',
                'materials_pickup_ready',
                'installation_scheduled',
                'materials_delivered',
                'installation_in_progress',
                'protocol_signed',
                'final_invoice_issued',
                'final_settlement',
                'complaint'
            ];
            filteredStatusOptions = statusOptions.filter(s => inProgressStatuses.includes(s.value));
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
            {searchParams?.filter && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex justify-between items-center">
                    <span>
                        {searchParams.filter === 'urgent' && "Filtrowanie: Wiszące montaże (bez daty)"}
                        {searchParams.filter === 'payments' && "Filtrowanie: Nierozliczone montaże (brak wpłaty)"}
                    </span>
                    <Link href="/dashboard/crm/montaze" className="text-amber-900 underline font-medium">
                        Wyczyść filtr
                    </Link>
                </div>
            )}
            <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10">
                <div className="flex flex-col md:flex-row md:h-16 md:items-center px-4 py-3 md:py-0 sm:px-6 justify-between gap-3 md:gap-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold">{isOnlyArchitect ? 'Moje Projekty' : 'Centrum Montaży'}</h1>
                        <div className="flex items-center gap-2 md:hidden">
                            {!isOnlyArchitect && (
                                <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                                    <Link href="/dashboard/crm/montaze/ekipy">
                                        <span className="sr-only">Ekipy</span>
                                        <Users className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button asChild size="sm" className="h-8 w-8 p-0 rounded-full">
                                <Link href="/dashboard/crm/montaze/nowy">
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">Dodaj</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <MontageSortSelect />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden md:py-6">
                <MontageDashboardView 
                    montages={montagesList} 
                    statusOptions={filteredStatusOptions}
                    threatDays={threatDays}
                    alertSettings={alertSettings}
                    newLeadsCount={newLeadsCount} // Added prop
                    headerAction={
                        <div className="flex gap-2">
                            <AddLeadModal />
                            <Button asChild>
                                <Link href="/dashboard/crm/montaze/nowy">
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
