import { desc, eq, asc, and, lt, or } from 'drizzle-orm';
import { differenceInCalendarDays, addBusinessDays, startOfDay } from 'date-fns';
import { parseTaskOverrides } from '@/app/dashboard/orders/utils';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
    manualOrders,
} from '@/lib/db/schema';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { mapMontageRow, type MontageRow } from '@/app/dashboard/crm/montaze/utils';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export interface AgendaItem {
    id: string;
    clientName: string;
    installationCity: string | null;
    scheduledInstallationAt: Date | number | string | null;
    displayId: string | null;
    floorArea: number | null;
}

export interface MontageSimple {
    id: string;
    clientName: string;
    scheduledInstallationAt: Date | string | number | null;
    status: string;
}

export interface MontageAlert {
    id: string;
    clientName: string;
    scheduledInstallationAt: Date | null;
    materialStatus: 'none' | 'ordered' | 'in_stock' | 'delivered';
    installerStatus: 'none' | 'informed' | 'confirmed';
}

export interface MontageAlertItem {
    montage: MontageAlert;
    issues: string[];
}

export interface MeasurementAlert {
    id: string;
    clientName: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MeasurementAlertItem {
    montage: MeasurementAlert;
    issues: string[];
}

// Types matching DashboardBuilderProps['data']
export interface DashboardStats {
    upcomingMontages: AgendaItem[];
    recentMontages: Montage[];
    tasksStats: {
        tasksCount: number;
        urgentCount: number;
        todoCount: number;
        reminderTasks: { id: string; content: string; reminderAt: Date | null; dueDate: Date | null }[];
    };
    kpiData: {
        newLeadsCount: number;
        pendingPaymentsCount: number;
        pendingContractsCount: number;
        urgentTasksCount: number;
        newOrdersCount: number;
        todoCount: number;
        urgentOrdersCount?: number;
        stalledOrdersCount?: number;
        orderUrgentDays?: number;
    };
    upcomingMontagesStats: {
        montages7Days: MontageSimple[];
        montages3Days: MontageSimple[];
        montagesInProgress: MontageSimple[];
    };
    montageAlerts: MontageAlertItem[];
    measurementAlerts: MeasurementAlertItem[];
    threatDays?: number;
}

export async function getDashboardStats(publicBaseUrl: string | null): Promise<DashboardStats> {
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
            quotes: {
                with: {
                    contract: true
                }
            },
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
            status: m.status,
            forecastedInstallationDate: m.forecastedInstallationDate,
            city: m.installationCity ?? m.billingCity
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
        .slice(0, 3)
        .map(m => ({
            id: m.id,
            clientName: m.clientName || 'Klient',
            installationCity: m.installationCity ?? m.billingCity,
            scheduledInstallationAt: m.scheduledInstallationAt,
            displayId: m.displayId,
            floorArea: m.floorArea
        }));

    const newLeadsCount = allMontages.filter(m => m.status === 'lead').length;
    const pendingPaymentsCount = allMontages.filter(m => m.status === 'before_first_payment' || m.status === 'before_final_invoice').length;
    
    const pendingContractsCount = allMontages.filter(m => {
        if (m.status === 'lead' || m.status === 'completed') return false;
        const activeQuote = m.quotes.find(q => q.status === 'sent' || q.status === 'accepted');
        if (!activeQuote) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (activeQuote as any).contract?.status !== 'signed';
    }).length;

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
             return { 
                 montage: {
                     id: m.id,
                     clientName: m.clientName || 'Klient',
                     scheduledInstallationAt: m.scheduledInstallationAt,
                     materialStatus: m.materialStatus,
                     installerStatus: m.installerStatus
                 },
                 issues
             };
        }
        return null;
    }).filter((item): item is MontageAlertItem => item !== null)
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
            return { 
                montage: {
                    id: m.id,
                    clientName: m.clientName || 'Klient',
                    status: m.status,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt
                },
                issues 
            };
        }
        return null;
    }).filter((item): item is MeasurementAlertItem => item !== null)
    .sort((a, b) => {
        const dateA = a.montage.createdAt ? new Date(a.montage.createdAt).getTime() : 0;
        const dateB = b.montage.createdAt ? new Date(b.montage.createdAt).getTime() : 0;
        return dateA - dateB;
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

    return {
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
            pendingContractsCount,
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
    };
}

export async function getArchitectDashboardStats(userId: string) {
    const architectProjects = await db.query.montages.findMany({
        where: eq(montages.architectId, userId),
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

    return {
        projects: architectProjects,
        stats: {
            activeProjects,
            completedProjects,
            totalCommission: 0 // Placeholder
        }
    };
}
