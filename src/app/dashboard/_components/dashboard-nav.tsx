'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type UserRole } from '@/lib/db/schema';

const links = [
	{ href: '/dashboard', label: 'Przegląd' },
    { href: '/dashboard/zadania', label: 'Zadania Montaże' },
	{ href: '/dashboard/calendar', label: 'Kalendarz' },
	{ href: '/dashboard/customers', label: 'Klienci' },
	{ href: '/dashboard/orders', label: 'Zamówienia' },
	{ href: '/dashboard/products', label: 'Produkty' },
	{ href: '/dashboard/montaze', label: 'Montaże' },
    { href: '/dashboard/wyceny', label: 'Wyceny' },
	{ href: '/dashboard/montaze/galeria', label: 'Galeria' },
	{ href: '/dashboard/mail', label: 'Poczta' },
	{ href: '/dashboard/settings', label: 'Ustawienia' },
];

export function DashboardNav({ urgentOrdersCount = 0, userRoles = ['admin'] }: { urgentOrdersCount?: number; userRoles?: UserRole[] }) {
	const pathname = usePathname();

    const filteredLinks = links.filter(link => {
        if (userRoles.includes('admin')) return true;
        const restrictedLinks = ['/dashboard/customers', '/dashboard/orders', '/dashboard/products', '/dashboard/mail', '/dashboard/settings'];
        return !restrictedLinks.includes(link.href);
    });

	return (
		<nav className="mb-8 pb-2 overflow-x-auto no-scrollbar">
			<ul className="flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 w-max mx-auto backdrop-blur-sm">
				{filteredLinks.map((link) => {
					const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(`${link.href}/`));

					return (
						<li key={link.href} className="relative">
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
							<Link
								href={link.href}
								className={cn(
									'relative z-10 block px-4 py-2 text-sm font-medium transition-colors rounded-full whitespace-nowrap',
									isActive
										? 'text-foreground'
										: 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
								)}
							>
								{link.label}
                                {link.href === '/dashboard/orders' && urgentOrdersCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
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
