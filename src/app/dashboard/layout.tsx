import type { ReactNode } from 'react';

import Link from 'next/link';

import { DashboardNav } from './_components/dashboard-nav';
import { MobileNav } from './_components/mobile-nav';
import { LogoutButton } from './_components/logout-button';
import { logoutAction } from './actions';
import { requireUser } from '@/lib/auth/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	const user = await requireUser();

	return (
		<div className="min-h-screen bg-muted pb-16 md:pb-0">
			<header className="hidden md:block border-b bg-background">
				<div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-3">
					<Link href="/dashboard" className="text-lg font-semibold">
						Panel firmy
					</Link>
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
					<DashboardNav />
				</div>
				{children}
			</main>
            <MobileNav user={user} />
		</div>
	);
}
