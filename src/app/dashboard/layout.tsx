import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

import Link from 'next/link';

import { redirect } from 'next/navigation';
import { DashboardNav } from './_components/dashboard-nav';
import { MobileNav } from './_components/mobile-nav';
import { LogoutButton } from './_components/logout-button';
import { BackButton } from './_components/back-button';
import { logoutAction } from './actions';
import { requireUser } from '@/lib/auth/session';
import { getUrgentOrdersCount } from './orders/queries';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	let user;
    try {
        user = await requireUser();
    } catch (error) {
        // Rethrow redirect errors (NEXT_REDIRECT)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any)?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Auth error in layout:', error);
        redirect('/login');
    }
    
    let urgentOrdersCount = 0;
    try {
        urgentOrdersCount = await getUrgentOrdersCount();
    } catch (error) {
        console.error('Failed to fetch urgent orders count:', error);
    }

	return (
        <>
            <div className="min-h-dvh bg-muted pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <BackButton />
                        <span className="font-semibold">Panel firmy</span>
                    </div>
                </header>

                <header className="hidden md:block border-b bg-background">
                    <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-4">
                            <BackButton />
                            <Link href="/dashboard" className="text-lg font-semibold">
                                Panel firmy
                            </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{user.name ?? user.email}</span>
                            <form action={logoutAction}>
                                <LogoutButton />
                            </form>
                        </div>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-[1600px] p-0 md:px-5 md:py-8">
                    <div className="hidden md:block px-4 py-4 md:p-0">
                        <DashboardNav urgentOrdersCount={urgentOrdersCount} />
                    </div>
                    {children}
                </main>
            </div>
            <MobileNav user={user} urgentOrdersCount={urgentOrdersCount} />
        </>
	);
}
