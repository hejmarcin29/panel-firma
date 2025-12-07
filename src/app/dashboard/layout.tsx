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
import { requireUser } from '@/lib/auth/session';
import { getUrgentOrdersCount } from './orders/queries';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	let sessionUser;
    try {
        sessionUser = await requireUser();
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
    
    let urgentOrdersCount = 0;
    try {
        urgentOrdersCount = await getUrgentOrdersCount();
    } catch (error) {
        console.error('Failed to fetch urgent orders count:', error);
    }

	return (
        <>
            <div className="min-h-dvh bg-zinc-50/50 dark:bg-zinc-950 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 relative isolate">
                {/* Background Pattern */}
                <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <Suspense>
                            <BackButton />
                        </Suspense>
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
                            <Link href="/dashboard" className="text-lg font-semibold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">
                                Panel firmy
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
                        <DashboardNav urgentOrdersCount={urgentOrdersCount} userRoles={userRoles} />
                    </div>
                    {children}
                </main>
            </div>
            <MobileNav user={user} urgentOrdersCount={urgentOrdersCount} userRoles={userRoles} />
        </>
	);
}
