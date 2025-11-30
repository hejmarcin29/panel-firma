import { desc, asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
    users,
    manualOrders,
    boardTasks,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { mapMontageRow, type MontageRow } from './montaze/utils';
import { DashboardBuilder } from './_components/dashboard-builder';
import type { DashboardLayoutConfig } from './actions';

const DEFAULT_LAYOUT: DashboardLayoutConfig = {
    columns: {
        left: [
            { id: 'kpi-1', type: 'kpi' },
            { id: 'quick-1', type: 'quick-actions' },
            { id: 'recent-1', type: 'recent-activity' },
            { id: 'tasks-1', type: 'tasks' },
        ],
        right: [
            { id: 'agenda-1', type: 'agenda' },
        ]
    }
};

import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    let user;
    try {
	    user = await requireUser();
    } catch (error) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         if ((error as any)?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Auth error in dashboard page:', error);
        redirect('/login');
    }

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    // Fetch User Config
    let dbUser = null;
    try {
        dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
    } catch (error) {
        console.error('Failed to fetch user config:', error);
        // Continue with default layout
    }

    let layout = DEFAULT_LAYOUT;
    if (dbUser?.dashboardConfig) {
        try {
            const savedLayout = dbUser.dashboardConfig as unknown as DashboardLayoutConfig;
            
            // Validate layout structure
            if (savedLayout && savedLayout.columns && Array.isArray(savedLayout.columns.left) && Array.isArray(savedLayout.columns.right)) {
                layout = savedLayout;
                
                // Migration: Ensure KPI widget exists
                const hasKpi = [...layout.columns.left, ...layout.columns.right].some(w => w.type === 'kpi');
                if (!hasKpi) {
                    layout = {
                        ...layout,
                        columns: {
                            ...layout.columns,
                            left: [{ id: 'kpi-1', type: 'kpi' }, ...layout.columns.left]
                        }
                    };
                }
            } else {
                console.warn('Invalid dashboard config found, using default.');
            }
        } catch (e) {
            console.error("Failed to parse dashboard config", e);
            layout = DEFAULT_LAYOUT;
        }
    }

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
    const allMontages = await db.query.montages.findMany({
        with: {
            tasks: true
        }
    });

    // Calculate Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMontagesCount = allMontages.filter(m => {
        if (!m.scheduledInstallationAt) return false;
        const date = new Date(m.scheduledInstallationAt);
        return date >= today && date < tomorrow;
    }).length;

    const upcomingMontages = allMontages
        .filter(m => m.scheduledInstallationAt && new Date(m.scheduledInstallationAt) >= today)
        .sort((a, b) => new Date(a.scheduledInstallationAt!).getTime() - new Date(b.scheduledInstallationAt!).getTime())
        .slice(0, 3);

    const newLeadsCount = allMontages.filter(m => m.status === 'lead').length;
    const pendingPaymentsCount = allMontages.filter(m => m.status === 'before_first_payment' || m.status === 'before_final_invoice').length;
    
    // Urgent tasks: Montages that are not completed/lead but have no date, or maybe just a placeholder logic for now.
    const urgentTasksCount = allMontages.filter(m => m.status !== 'lead' && m.status !== 'completed' && !m.scheduledInstallationAt).length;

    // Fetch New Orders Count
    const newOrders = await db.query.manualOrders.findMany({
        where: eq(manualOrders.status, 'Zamówienie utworzone'),
    });
    const newOrdersCount = newOrders.length;

    // Fetch Personal Todo Count
    const todoTasks = await db.select().from(boardTasks);
    const todoCount = todoTasks.length;

    // Tasks Widget Data (Lite)
    const tasksMontagesRaw = allMontages.filter(m => m.tasks.some(t => !t.completed));
    const tasksCount = tasksMontagesRaw.length;
    const urgentCount = tasksMontagesRaw.filter(m => {
        if (!m.scheduledInstallationAt) return false;
        const date = new Date(m.scheduledInstallationAt);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }).length;

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dzień dobry, {user.name || 'Użytkowniku'}!</h1>
                    <p className="text-muted-foreground">Oto co dzieje się dzisiaj w Twojej firmie.</p>
                </div>
            </div>

            <DashboardBuilder 
                initialLayout={layout} 
                data={{
                    upcomingMontages,
                    recentMontages,
                    tasksStats: {
                        tasksCount,
                        urgentCount
                    },
                    kpiData: {
                        todayMontagesCount,
                        newLeadsCount,
                        pendingPaymentsCount,
                        urgentTasksCount,
                        newOrdersCount,
                        todoCount,
                    }
                }}
            />
        </div>
    );
}
