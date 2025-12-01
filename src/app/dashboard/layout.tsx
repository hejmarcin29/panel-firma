import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { AppSidebar } from './_components/app-sidebar';
import { MobileNav } from './_components/mobile-nav';
import { BackButton } from './_components/back-button';
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
    
    let urgentOrdersCount = 0;
    try {
        urgentOrdersCount = await getUrgentOrdersCount();
    } catch (error) {
        console.error('Failed to fetch urgent orders count:', error);
    }

	return (
        <div className="flex min-h-screen bg-muted/30">
            {/* Desktop Sidebar */}
            <AppSidebar urgentOrdersCount={urgentOrdersCount} user={user} />

            <div className="flex-1 flex flex-col min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
                 {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 py-3 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <BackButton />
                        <span className="font-semibold">Panel firmy</span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>
            </div>
            
            <MobileNav user={user} urgentOrdersCount={urgentOrdersCount} />
        </div>
	);
}
