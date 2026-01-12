"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    {
        label: "Dziś",
        href: "/installer",
        icon: Home
    },
    {
        label: "Kalendarz",
        href: "/installer/calendar",
        icon: Calendar
    },
    {
        label: "Wiadomości",
        href: "/installer/messages",
        icon: MessageSquare
    },
    {
        label: "Profil",
        href: "/installer/profile",
        icon: User
    }
];

export function InstallerNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-full transition-colors",
                                isActive && "bg-primary/10"
                            )}>
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}
