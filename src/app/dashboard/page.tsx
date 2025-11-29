import { desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { mapMontageRow, type MontageRow } from './montaze/utils';
import { KPICards } from './_components/kpi-cards';
import { AgendaWidget } from './_components/agenda-widget';
import { RecentActivity } from './_components/recent-activity';
import { QuickActions } from './_components/quick-actions';
import { DashboardCharts } from './_components/dashboard-charts';

export default async function DashboardPage() {
	const user = await requireUser();
    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    // Fetch Recent Montages (for Activity Feed)
    const recentMontageRows = await db.query.montages.findMany({
        orderBy: desc(montages.updatedAt),
        limit: 5,
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

    const recentMontages = recentMontageRows.map(row => mapMontageRow(row as MontageRow, publicBaseUrl));

    // Fetch All Montages (Lightweight for Stats)
    const allMontages = await db.select({
        id: montages.id,
        status: montages.status,
        scheduledInstallationAt: montages.scheduledInstallationAt,
        clientName: montages.clientName,
        installationCity: montages.installationCity,
        displayId: montages.displayId,
    }).from(montages);

    // Calculate Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMontages = allMontages.filter(m => {
        if (!m.scheduledInstallationAt) return false;
        const date = new Date(m.scheduledInstallationAt);
        return date >= today && date < tomorrow;
    });

    const newLeadsCount = allMontages.filter(m => m.status === 'lead').length;
    const pendingPaymentsCount = allMontages.filter(m => m.status === 'before_first_payment' || m.status === 'before_final_invoice').length;
    
    // Urgent tasks: Montages that are not completed/lead but have no date, or maybe just a placeholder logic for now.
    const urgentTasksCount = allMontages.filter(m => m.status !== 'lead' && m.status !== 'completed' && !m.scheduledInstallationAt).length;

    // Chart Data
    const statusCounts = allMontages.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dzień dobry, {user.name || 'Użytkowniku'}!</h1>
                    <p className="text-muted-foreground">Oto co dzieje się dzisiaj w Twojej firmie.</p>
                </div>
            </div>

            <KPICards 
                todayMontagesCount={todayMontages.length}
                newLeadsCount={newLeadsCount}
                pendingPaymentsCount={pendingPaymentsCount}
                urgentTasksCount={urgentTasksCount}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <DashboardCharts data={chartData} />
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid gap-6">
                     <AgendaWidget todayMontages={todayMontages} />
                     <QuickActions />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <RecentActivity recentMontages={recentMontages} />
            </div>
        </div>
    );
}
