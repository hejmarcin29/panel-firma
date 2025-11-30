'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const links = [
	{ href: '/dashboard', label: 'Przegląd' },
	{ href: '/dashboard/calendar', label: 'Kalendarz' },
    { href: '/dashboard/zadania', label: 'Zadania' },
	{ href: '/dashboard/orders', label: 'Zamówienia' },
	{ href: '/dashboard/montaze', label: 'Montaże' },
	{ href: '/dashboard/montaze/galeria', label: 'Galeria' },
	{ href: '/dashboard/mail', label: 'Poczta' },
	{ href: '/dashboard/settings', label: 'Ustawienia' },
];

export function DashboardNav({ urgentOrdersCount = 0 }: { urgentOrdersCount?: number }) {
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
									'rounded-full px-3 py-1 transition-colors relative',
									isActive
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{link.label}
                                {link.href === '/dashboard/orders' && urgentOrdersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
