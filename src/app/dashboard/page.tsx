import { desc, eq, asc, and, lt, or } from 'drizzle-orm';
import { differenceInCalendarDays, addBusinessDays, startOfDay } from 'date-fns';
import { parseTaskOverrides } from '@/app/dashboard/orders/utils';

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
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

import { mapMontageRow, type MontageRow } from './montaze/utils';
import { DashboardBuilder } from './_components/dashboard-builder';
import type { DashboardLayoutConfig } from './actions';

const DEFAULT_LAYOUT: DashboardLayoutConfig = {
    columns: {
        left: [
            { id: 'alerts-1', type: 'montage-alerts' },
            { id: 'upcoming-1', type: 'upcoming-montages' },
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
        if (user.roles.includes('installer') && !user.roles.includes('measurer') && !user.roles.includes('admin')) {
            redirect('/dashboard/montaze');
        }
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

    const kpiMontageThreatDays = await getAppSetting(appSettingKeys.kpiMontageThreatDays);
    const threatDays = Number(kpiMontageThreatDays ?? 7);

    const kpiOrderUrgentDays = await getAppSetting(appSettingKeys.kpiOrderUrgentDays);
    const orderUrgentDays = Number(kpiOrderUrgentDays ?? 3);

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

                // Migration: Ensure Alerts widget exists
                const hasAlerts = [...layout.columns.left, ...layout.columns.right].some(w => w.type === 'montage-alerts');
                if (!hasAlerts) {
                    layout = {
                        ...layout,
                        columns: {
                            ...layout.columns,
                            left: [{ id: 'alerts-1', type: 'montage-alerts' }, ...layout.columns.left]
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
            quotes: true,
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
    const today = startOfDay(new Date());
    
    // Upcoming Montages Logic
    const limit7Days = addBusinessDays(today, 7);
    const limit3Days = addBusinessDays(today, 3);
    const tomorrow = addBusinessDays(today, 1);

    const montages7Days: { id: string; clientName: string; scheduledInstallationAt: Date | string | number | null; status: string }[] = [];
    const montages3Days: { id: string; clientName: string; scheduledInstallationAt: Date | string | number | null; status: string }[] = [];
    const montagesInProgress: { id: string; clientName: string; scheduledInstallationAt: Date | string | number | null; status: string }[] = [];

    for (const m of allMontages) {
        if (m.status === 'completed' || m.status === 'lead') continue;

        const simpleMontage = {
            id: m.id,
            clientName: m.clientName || 'Klient',
            scheduledInstallationAt: m.scheduledInstallationAt,
            status: m.status
        };

        if (m.scheduledInstallationAt) {
            const date = new Date(m.scheduledInstallationAt);
            
            // In Progress: Date is today or past
            if (date < tomorrow) { 
                 montagesInProgress.push(simpleMontage);
            } 
            // Future: Within 3 days
            else if (date <= limit3Days) {
                montages3Days.push(simpleMontage);
                montages7Days.push(simpleMontage);
            }
            // Future: Within 7 days
            else if (date <= limit7Days) {
                montages7Days.push(simpleMontage);
            }
        }
    }

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
        where: or(
            eq(manualOrders.status, 'Zamówienie utworzone'),
            eq(manualOrders.requiresReview, true)
        ),
    });
    const newOrdersCount = newOrders.length;

    const urgentOrdersLimitDate = new Date();
    urgentOrdersLimitDate.setDate(urgentOrdersLimitDate.getDate() - orderUrgentDays);

    const urgentOrders = await db.query.manualOrders.findMany({
        where: and(
            eq(manualOrders.status, 'Zamówienie utworzone'),
            lt(manualOrders.createdAt, urgentOrdersLimitDate)
        )
    });
    const urgentOrdersCount = urgentOrders.length;

    // Tasks Widget Data (Lite)
    const tasksMontagesRaw = allMontages.filter(m => m.tasks.some(t => !t.completed));
    const tasksCount = tasksMontagesRaw.length;
    const urgentCount = tasksMontagesRaw.filter(m => {
        if (!m.scheduledInstallationAt) return false;
        const date = new Date(m.scheduledInstallationAt);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }).length;

    // Alerts Logic (Red Statuses & Material Warnings)
    const montageAlerts = allMontages.map(m => {
        // Skip completed or leads
        if (m.status === 'completed' || m.status === 'lead') return null;

        const issues: string[] = [];
        
        // 1. Red Statuses (Always check for active montages)
        if (m.materialStatus === 'none') issues.push("Brak statusu materiału");
        if (m.installerStatus === 'none') issues.push("Brak statusu montażu");
        if (!m.measurerId) issues.push("Brak przypisanego pomiarowca");
        if (!m.installerId) issues.push("Brak przypisanego montażysty");

        // 2. Material Time Warnings (Exclamation Mark Logic)
        if (m.scheduledInstallationAt) {
            const date = new Date(m.scheduledInstallationAt);
            const days = differenceInCalendarDays(date, today);
            
            // Only check for upcoming/recent
            if (days >= 0) {
                if (days <= 5 && m.materialStatus === 'ordered') issues.push("Materiał tylko zamówiony (bliski termin)");
                if (days <= 2 && m.materialStatus === 'in_stock') issues.push("Materiał tylko na magazynie (bardzo bliski termin)");
            }
        }
        
        if (issues.length > 0) {
             return { montage: m, issues };
        }
        return null;
    }).filter((item): item is { montage: typeof allMontages[0], issues: string[] } => item !== null)
    .sort((a, b) => {
        const dateA = a.montage.scheduledInstallationAt ? new Date(a.montage.scheduledInstallationAt).getTime() : 0;
        const dateB = b.montage.scheduledInstallationAt ? new Date(b.montage.scheduledInstallationAt).getTime() : 0;
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
    });

    // Stalled Orders Logic
    const allOrders = await db.query.manualOrders.findMany();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate();
    const isMonthEnd = daysLeft <= 5; // Alert if 5 days or less left in month

    const stalledOrdersCount = allOrders.filter(order => {
        const overrides = parseTaskOverrides(order.timelineTaskOverrides);
        const acceptedByWarehouse = overrides['Zamówienie przyjęte przez magazyn'];
        const finalInvoiceIssued = overrides['Wystawiono fakturę końcową'];
        
        // Only care if accepted by warehouse AND invoice NOT issued
        if (!acceptedByWarehouse) return false;
        if (finalInvoiceIssued) return false;
        
        // Check time condition
        const updatedAt = order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt);
        const daysSinceUpdate = differenceInCalendarDays(today, updatedAt);
        
        if (daysSinceUpdate > 7) return true;
        if (isMonthEnd) return true;
        
        return false;
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
                    montageAlerts,
                    threatDays,
                    tasksStats: {
                        tasksCount,
                        urgentCount,
                        todoCount: 0,
                        reminderTasks: []
                    },
                    kpiData: {
                        newLeadsCount,
                        pendingPaymentsCount,
                        urgentTasksCount,
                        newOrdersCount,
                        todoCount: 0,
                        urgentOrdersCount,
                        stalledOrdersCount,
                        orderUrgentDays,
                    }
                }}
            />
        </div>
    );
}
