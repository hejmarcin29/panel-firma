'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LayoutDashboard, Package, Star, Newspaper, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    {
        href: '/dashboard/shop',
        label: 'Przegląd',
        icon: LayoutDashboard,
        exact: true
    },
    {
        href: '/dashboard/shop/orders',
        label: 'Zamówienia',
        icon: ShoppingCart,
        exact: false
    },
    {
        href: '/dashboard/shop/offer',
        label: 'Katalog',
        icon: Package,
        exact: false
    },
    {
        href: '/dashboard/shop/reviews',
        label: 'Opinie',
        icon: Star,
        exact: false
    },
    {
        href: '/dashboard/shop/blog',
        label: 'Blog',
        icon: Newspaper,
        exact: false
    }
];

export function ShopNav() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col border-b bg-white dark:bg-zinc-950 sticky top-0 z-10 w-full">
             <div className="flex h-14 items-center px-4 gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = item.exact 
                            ? pathname === item.href
                            : pathname?.startsWith(item.href);

                        return (
                            <Link key={item.href} href={item.href} className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "gap-2 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all",
                                        isActive && "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                                {isActive && (
                                    <motion.div
                                        layoutId="shop-nav-indicator"
                                        className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-indigo-600"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                     <Link href="/dashboard/settings/shop">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                "gap-2 text-zinc-500",
                                pathname?.includes('/settings/shop') && "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            <span className="hidden md:inline">Konfiguracja</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
