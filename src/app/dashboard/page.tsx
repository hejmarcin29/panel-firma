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
import { ArchitectDashboard } from './_components/architect-dashboard';
import type { DashboardLayoutConfig } from './actions';

const DEFAULT_LAYOUT: DashboardLayoutConfig = {
    columns: {
        left: [
            { id: 'alerts-1', type: 'montage-alerts' },
            { id: 'measurement-alerts-1', type: 'measurement-alerts' },
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

    // --- ARCHITECT DASHBOARD LOGIC ---
    if (user.roles.includes('architect') && !user.roles.includes('admin')) {
        const architectProjects = await db.query.montages.findMany({
            where: eq(montages.architectId, user.id),
            orderBy: desc(montages.updatedAt),
            columns: {
                id: true,
                clientName: true,
                status: true,
                address: true,
                updatedAt: true,
                scheduledInstallationAt: true,
            }
        });

        const activeProjects = architectProjects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
        const completedProjects = architectProjects.filter(p => p.status === 'completed').length;

        return (
            <ArchitectDashboard 
                user={user} 
                projects={architectProjects}
                stats={{
                    activeProjects,
                    completedProjects,
                    totalCommission: 0 // Placeholder
                }}
            />
        );
    }
    // ---------------------------------

    const kpiMontageThreatDays = await getAppSetting(appSettingKeys.kpiMontageThreatDays);
    const threatDays = Number(kpiMontageThreatDays ?? 7);

    const kpiOrderUrgentDays = await getAppSetting(appSettingKeys.kpiOrderUrgentDays);
    const orderUrgentDays = Number(kpiOrderUrgentDays ?? 3);

    const kpiAlertMissingMaterialStatusDays = await getAppSetting(appSettingKeys.kpiAlertMissingMaterialStatusDays);
    const missingMaterialStatusDays = Number(kpiAlertMissingMaterialStatusDays ?? 7);

    const kpiAlertMissingInstallerStatusDays = await getAppSetting(appSettingKeys.kpiAlertMissingInstallerStatusDays);
    const missingInstallerStatusDays = Number(kpiAlertMissingInstallerStatusDays ?? 7);

    const kpiAlertMissingInstallerDays = await getAppSetting(appSettingKeys.kpiAlertMissingInstallerDays);
    const missingInstallerDays = Number(kpiAlertMissingInstallerDays ?? 14);

    const kpiAlertMaterialOrderedDays = await getAppSetting(appSettingKeys.kpiAlertMaterialOrderedDays);
    const materialOrderedDays = Number(kpiAlertMaterialOrderedDays ?? 5);

    const kpiAlertMaterialInstockDays = await getAppSetting(appSettingKeys.kpiAlertMaterialInstockDays);
    const materialInstockDays = Number(kpiAlertMaterialInstockDays ?? 2);

    const kpiAlertLeadNoMeasurerDays = await getAppSetting(appSettingKeys.kpiAlertLeadNoMeasurerDays);
    const leadNoMeasurerDays = Number(kpiAlertLeadNoMeasurerDays ?? 3);

    const kpiAlertQuoteDelayDays = await getAppSetting(appSettingKeys.kpiAlertQuoteDelayDays);
    const quoteDelayDays = Number(kpiAlertQuoteDelayDays ?? 3);

    const kpiAlertOfferStalledDays = await getAppSetting(appSettingKeys.kpiAlertOfferStalledDays);
    const offerStalledDays = Number(kpiAlertOfferStalledDays ?? 7);

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

                // Migration: Ensure Measurement Alerts widget exists
                const hasMeasurementAlerts = [...layout.columns.left, ...layout.columns.right].some(w => w.type === 'measurement-alerts');
                if (!hasMeasurementAlerts) {
                    layout = {
                        ...layout,
                        columns: {
                            ...layout.columns,
                            left: [{ id: 'measurement-alerts-1', type: 'measurement-alerts' }, ...layout.columns.left]
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
            tasks: true,
            quotes: true,
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
        
        // Calculate days until installation
        let daysUntilInstallation = null;
        if (m.scheduledInstallationAt) {
            const date = new Date(m.scheduledInstallationAt);
            daysUntilInstallation = differenceInCalendarDays(date, today);
        }

        // Only check if we have a date (otherwise it falls into "No Date" urgent bucket)
        if (daysUntilInstallation !== null) {
            // 1. Red Statuses (Check based on configured days)
            // We check if the montage is within the alert window (e.g. <= 7 days)
            // We include overdue tasks (days < 0) in alerts too
            
            if (daysUntilInstallation <= missingMaterialStatusDays && m.materialStatus === 'none') {
                issues.push("Brak statusu materiału");
            }
            
            if (daysUntilInstallation <= missingInstallerStatusDays && m.installerStatus === 'none') {
                issues.push("Brak statusu montażu");
            }
            
            if (daysUntilInstallation <= missingInstallerDays && !m.installerId) {
                issues.push("Brak przypisanego montażysty");
            }

            // 2. Material Time Warnings (Exclamation Mark Logic)
            // Only for future/today (not past, as past is already a problem)
            if (daysUntilInstallation >= 0) {
                if (daysUntilInstallation <= materialOrderedDays && m.materialStatus === 'ordered') {
                    issues.push("Materiał tylko zamówiony (bliski termin)");
                }
                if (daysUntilInstallation <= materialInstockDays && m.materialStatus === 'in_stock') {
                    // Jeśli odbiór własny (montażysta lub klient), to status "Na magazynie" jest poprawny
                    const isPickup = m.materialClaimType === 'installer_pickup' || m.materialClaimType === 'client_pickup';
                    if (!isPickup) {
                        issues.push("Materiał tylko na magazynie (bardzo bliski termin)");
                    }
                }
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

    // Measurement Alerts Logic
    const measurementAlerts = allMontages.map(m => {
        if (m.status === 'completed') return null;

        const issues: string[] = [];
        const createdAt = new Date(m.createdAt);
        const updatedAt = new Date(m.updatedAt);
        const daysSinceCreation = differenceInCalendarDays(today, createdAt);
        const daysSinceUpdate = differenceInCalendarDays(today, updatedAt);

        // 1. Lead bez pomiarowca (X dni)
        if (m.status === 'lead' && !m.measurerId && daysSinceCreation >= leadNoMeasurerDays) {
            issues.push(`Lead bez pomiarowca od ${daysSinceCreation} dni`);
        }

        // 2. Opóźniona wycena (X dni po pomiarze)
        // Condition: Measurer assigned, no quote sent (or all drafts), and last update > X days
        const hasSentQuote = m.quotes.some(q => q.status === 'sent' || q.status === 'accepted');
        if (m.measurerId && !hasSentQuote && daysSinceUpdate >= quoteDelayDays) {
             issues.push(`Opóźniona wycena (${daysSinceUpdate} dni bez oferty)`);
        }

        // 3. Oferta stoi w miejscu (X dni bez zmiany statusu)
        // Condition: Quote sent, but not accepted/rejected, and last update > X days
        const sentQuotes = m.quotes.filter(q => q.status === 'sent');
        for (const quote of sentQuotes) {
            const quoteDate = new Date(quote.updatedAt);
            const daysSinceQuoteUpdate = differenceInCalendarDays(today, quoteDate);
            if (daysSinceQuoteUpdate >= offerStalledDays) {
                issues.push(`Oferta stoi w miejscu od ${daysSinceQuoteUpdate} dni`);
                break; // Only report once per montage
            }
        }

        if (issues.length > 0) {
            return { montage: m, issues };
        }
        return null;
    }).filter((item): item is { montage: typeof allMontages[0], issues: string[] } => item !== null)
    .sort((a, b) => {
        return new Date(a.montage.createdAt).getTime() - new Date(b.montage.createdAt).getTime();
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
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-8">
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
                    measurementAlerts,
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
                    },
                    upcomingMontagesStats: {
                        montages7Days,
                        montages3Days,
                        montagesInProgress,
                    },
                }}
            />
        </div>
    );
}
