import { asc, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

import { MontageDashboardView } from './_components/montage-dashboard-view';
import { mapMontageRow, type MontageRow } from './utils';
import { db } from '@/lib/db';
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

export default async function MontazePage() {
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

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="hidden md:block border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-16 items-center px-4 sm:px-6">
                    <h1 className="text-lg font-semibold">Centrum Montaży</h1>
                </div>
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
