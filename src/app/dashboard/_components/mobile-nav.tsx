"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { 
  Home, 
  Calendar, 
  Package, 
  Hammer, 
  Menu,
  Mail,
  Settings,
  Image as ImageIcon,
  LogOut
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "../actions";

const mainLinks = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/dashboard/calendar", label: "Kalendarz", icon: Calendar },
  { href: "/dashboard/orders", label: "Zamówienia", icon: Package },
  { href: "/dashboard/montaze", label: "Montaże", icon: Hammer },
];

const menuLinks = [
  { href: "/dashboard/mail", label: "Poczta", icon: Mail },
  { href: "/dashboard/montaze/galeria", label: "Galeria", icon: ImageIcon },
  { href: "/dashboard/settings", label: "Ustawienia", icon: Settings },
];

export function MobileNav({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors hover:bg-muted/50 min-w-16",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              {label}
            </Link>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors hover:bg-muted/50 text-muted-foreground min-w-16"
              )}
            >
              <Menu className="h-5 w-5" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 py-4 h-full">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground px-2">Aplikacje</p>
                    {menuLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname?.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                    isActive ? "bg-muted text-primary" : "text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </div>
                
                <div className="border-t pt-4 mt-auto">
                    <div className="flex items-center gap-3 px-2 py-2 mb-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name || 'Użytkownik'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                    <form action={logoutAction} className="w-full">
                        <MobileLogoutButton />
                    </form>
                </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function MobileLogoutButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="w-full justify-start gap-2" disabled={pending}>
      <LogOut className="h-4 w-4" />
      {pending ? 'Wylogowywanie...' : 'Wyloguj się'}
    </Button>
  );
}
