import type { ReactNode } from 'react';

import Link from 'next/link';

import { DashboardNav } from './_components/dashboard-nav';
import { LogoutButton } from './_components/logout-button';
import { logoutAction } from './actions';
import { requireUser } from '@/lib/auth/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	const user = await requireUser();

	return (
		<div className="min-h-screen bg-muted">
			<header className="border-b bg-background">
				<div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
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
			<main className="mx-auto w-full max-w-[1600px] px-6 py-10">
				<DashboardNav />
				{children}
			</main>
		</div>
	);
}
