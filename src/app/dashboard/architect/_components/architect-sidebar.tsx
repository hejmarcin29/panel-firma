'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FolderOpen, Wallet, ShoppingBag, User, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/dashboard/actions';

const navItems = [
    { label: 'Pulpit', href: '/dashboard/architect', icon: Home },
    { label: 'Showroom', href: '/dashboard/showroom', icon: ShoppingBag },
    { label: 'Projekty', href: '/dashboard/crm', icon: FolderOpen },
    { label: 'Portfel', href: '/dashboard/wallet', icon: Wallet },
];

export function ArchitectSidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-20 flex-col items-center py-8 bg-zinc-950 border-r border-zinc-800">
                {/* Logo */}
                <div className="mb-8 p-3 bg-zinc-900 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500" />
                </div>

                {/* Nav */}
                <nav className="flex-1 flex flex-col gap-4 w-full px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-200 group",
                                    isActive 
                                        ? "bg-indigo-600/10 text-indigo-400" 
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                                )}
                                title={item.label}
                            >
                                <item.icon className="h-6 w-6" />
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-4 px-4 w-full">
                    <form action={logoutAction}>
                        <button 
                            type="submit"
                            className="w-full flex justify-center p-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition-colors"
                            title="Wyloguj"
                        >
                            <LogOut className="h-6 w-6" />
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 z-50 w-full bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 pb-safe">
                <nav className="flex items-center justify-around p-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                                    isActive 
                                        ? "text-indigo-400" 
                                        : "text-zinc-500"
                                )}
                            >
                                <item.icon className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                    <form action={logoutAction}>
                         <button 
                            type="submit"
                            className="flex flex-col items-center justify-center p-2 text-zinc-500"
                        >
                            <LogOut className="h-6 w-6 mb-1" />
                            <span className="text-[10px] font-medium">Exit</span>
                        </button>
                    </form>
                </nav>
            </div>
        </>
    );
}
