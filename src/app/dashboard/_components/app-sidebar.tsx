"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    CheckSquare, 
    Hammer, 
    Calendar, 
    ShoppingCart, 
    Wrench, 
    Image as ImageIcon, 
    Mail, 
    Settings,
    LogOut
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions";

const links = [
    { href: '/dashboard', label: 'Przegląd', icon: LayoutDashboard },
    { href: '/dashboard/todo', label: 'To Do', icon: CheckSquare },
    { href: '/dashboard/zadania', label: 'Zadania Montaże', icon: Hammer },
    { href: '/dashboard/calendar', label: 'Kalendarz', icon: Calendar },
    { href: '/dashboard/orders', label: 'Zamówienia', icon: ShoppingCart },
    { href: '/dashboard/montaze', label: 'Montaże', icon: Wrench },
    { href: '/dashboard/montaze/galeria', label: 'Galeria', icon: ImageIcon },
    { href: '/dashboard/mail', label: 'Poczta', icon: Mail },
    { href: '/dashboard/settings', label: 'Ustawienia', icon: Settings },
];

interface User {
    name: string | null;
    email: string;
}

interface AppSidebarProps {
    urgentOrdersCount?: number;
    user?: User;
}

export function AppSidebar({ urgentOrdersCount = 0, user }: AppSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 p-4">
            <div className="flex flex-col h-full bg-card rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            P
                        </div>
                        <span>Panel Firmy</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(`${link.href}/`));
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md translate-x-1"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                <span>{link.label}</span>
                                
                                {link.href === '/dashboard/orders' && urgentOrdersCount > 0 && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold shadow-sm">
                                        {urgentOrdersCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-border/50 bg-muted/30">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {user?.name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.name || 'Użytkownik'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <form action={logoutAction}>
                         <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20" type="submit">
                            <LogOut className="h-4 w-4" />
                            Wyloguj się
                         </Button>
                    </form>
                </div>
            </div>
        </aside>
    );
}
