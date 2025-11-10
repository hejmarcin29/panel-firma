'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const links = [
	{ href: '/dashboard', label: 'Przegląd' },
	{ href: '/dashboard/orders', label: 'Zamówienia' },
];

export function DashboardNav() {
	const pathname = usePathname();

	return (
		<nav className="mb-8 border-b pb-3">
			<ul className="flex flex-wrap items-center gap-4 text-sm font-medium">
				{links.map((link) => {
					const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);

					return (
						<li key={link.href}>
							<Link
								href={link.href}
								className={cn(
									'rounded-full px-3 py-1 transition-colors',
									isActive
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{link.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
