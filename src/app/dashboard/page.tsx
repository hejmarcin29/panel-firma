import { eq } from 'drizzle-orm';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Pulpit',
};

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { DashboardBuilder } from './_components/dashboard-builder';
import { ArchitectDashboard } from './_components/architect-dashboard';
import { InstallerDashboard } from './_components/installer-dashboard';
import type { DashboardLayoutConfig } from './actions';
import { getDashboardStats, getArchitectDashboardStats, getInstallerDashboardData } from '@/lib/services/dashboard-service';
import { redirect } from 'next/navigation';

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

export default async function DashboardPage() {
    let user;

    try {
	    user = await requireUser();
        
        // Redirect Architect to Premium Dashboard
        if (user.roles.includes('architect') && !user.roles.includes('admin')) {
            redirect('/dashboard/architect');
        }

        if (user.roles.includes('installer') && !user.roles.includes('admin')) {
            redirect('/dashboard/crm/montaze');
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

    // --- PARTNER DASHBOARD LOGIC ---
    if (user.roles.includes('partner') && !user.roles.includes('admin')) {
        redirect('/dashboard/partner');
    }

    // --- ARCHITECT DASHBOARD LOGIC ---
    if (user.roles.includes('architect') && !user.roles.includes('admin')) {
        const { projects, stats } = await getArchitectDashboardStats(user.id);

        return (
            <ArchitectDashboard 
                user={user} 
                projects={projects}
                stats={stats}
            />
        );
    }
    // ---------------------------------

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

    const dashboardStats = await getDashboardStats(publicBaseUrl);

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
                data={dashboardStats}
            />
        </div>
    );
}
