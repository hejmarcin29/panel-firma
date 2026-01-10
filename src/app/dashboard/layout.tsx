import { type ReactNode, Suspense } from 'react';

export const dynamic = 'force-dynamic';

import Link from 'next/link';

import { redirect } from 'next/navigation';
import { DashboardNav } from './_components/dashboard-nav';
import { MobileNav } from './_components/mobile-nav';
import { LogoutButton } from './_components/logout-button';
import { BackButton } from './_components/back-button';
import { RefreshButton } from './_components/refresh-button';
import { logoutAction } from './actions';
import { getCurrentSession } from '@/lib/auth/session';
import { getUrgentOrdersCount } from './crm/ordersWP/queries';
import { db } from '@/lib/db';
import { users, montages } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ImpersonationBanner } from './_components/impersonation-banner';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { ArchitectSidebar } from './architect/_components/architect-sidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	let sessionUser;
    let isImpersonating = false;
    try {
        const session = await getCurrentSession();
        if (!session) {
             redirect('/login');
        }
        sessionUser = session.user;
        isImpersonating = !!session.originalUserId;
    } catch (error) {
        // Rethrow redirect errors (NEXT_REDIRECT)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any)?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Auth error in layout:', error);
        redirect('/login');
    }

    const userDetails = await db.query.users.findFirst({
        where: eq(users.id, sessionUser.id),
        columns: { mobileMenuConfig: true }
    });

    const user = {
        ...sessionUser,
        mobileMenuConfig: userDetails?.mobileMenuConfig ? JSON.stringify(userDetails.mobileMenuConfig) : null
    };
    
    const userRoles = sessionUser.roles;

    // === ARCHITECT LAYOUT ===
    if (userRoles.includes('architect')) {
        return (
            <div className="min-h-screen bg-zinc-50/50 font-sans selection:bg-indigo-500/30">
                {isImpersonating && <ImpersonationBanner />}
                <ArchitectSidebar />
                <main className="md:pl-20 pb-24 md:pb-0 min-h-screen">
                    {children}
                </main>
            </div>
        );
    }
    
    let urgentOrdersCount = 0;
    try {
        urgentOrdersCount = await getUrgentOrdersCount();
    } catch (error) {
        console.error('Failed to fetch urgent orders count:', error);
    }

    let newLeadsCount = 0;
    try {
        const leadsRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(montages)
            .where(eq(montages.status, 'new_lead'));
        newLeadsCount = Number(leadsRes[0]?.count ?? 0);
    } catch (e) {
        console.error('Failed to fetch leads count:', e);
    }

    let systemLogoUrl = await getAppSetting(appSettingKeys.systemLogoUrl);
    if (systemLogoUrl && !systemLogoUrl.startsWith('http') && !systemLogoUrl.startsWith('/')) {
        systemLogoUrl = `https://${systemLogoUrl}`;
    }
    const logoSrc = systemLogoUrl || "/window.svg";

	return (
        <>
            {isImpersonating && <ImpersonationBanner />}
            <div className="min-h-dvh bg-zinc-50/50 dark:bg-zinc-950 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-0 relative isolate">
                {/* Background Pattern */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <Suspense>
                            <BackButton />
                        </Suspense>
                        <div className="relative h-8 w-8">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold">Panel firmy</span>
                    </div>
                    <RefreshButton />
                </header>

                <header className="hidden md:block border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-4">
                            <Suspense>
                                <BackButton />
                            </Suspense>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="relative h-8 w-8">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-lg font-semibold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">
                                    Panel firmy
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <RefreshButton />
                            <span className="text-muted-foreground">{user.name ?? user.email}</span>
                            <form action={logoutAction}>
                                <LogoutButton />
                            </form>
                        </div>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-[1600px] p-0 md:px-5 md:py-8">
                    <div className="hidden md:block px-4 py-4 md:p-0 sticky top-[65px] z-40 bg-transparent">
                        <DashboardNav leadsCount={newLeadsCount} userRoles={userRoles} />
                    </div>
                    {children}
                </main>
            </div>
            <MobileNav user={user} urgentOrdersCount={urgentOrdersCount} leadsCount={newLeadsCount} userRoles={userRoles} />
        </>
	);
}
