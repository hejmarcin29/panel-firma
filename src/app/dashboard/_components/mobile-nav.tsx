"use client";

import { useState, useEffect } from "react";
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
  LogOut,
  ClipboardList,
  KanbanSquare,
  LucideIcon,
  Users,
  ShoppingBag,
  Monitor,
  FileText,
  Store,
  Factory,
  Wallet,
  Handshake,
  ShoppingCart
} from "lucide-react";

import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "../actions";
import { MobileMenuItem } from "../settings/actions";
import { type UserRole } from '@/lib/db/schema';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Calendar,
  Package,
  Hammer,
  Menu,
  Mail,
  Settings,
  ImageIcon,
  LogOut,
  ClipboardList,
  KanbanSquare,
  Users,
  ShoppingBag,
  Monitor,
  FileText,
  Store,
  Factory,
  Wallet,
  Handshake,
  ShoppingCart
};

const mainLinks = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/dashboard/zadania", label: "Zadania", icon: ClipboardList },
  { href: "/dashboard/calendar", label: "Kalendarz", icon: Calendar },
];

const menuLinks = [
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/erp/products", label: "Produkty", icon: ShoppingBag },
  { href: "/dashboard/erp", label: "ERP", icon: Factory },
  { href: "/dashboard/shop", label: "Sklep", icon: ShoppingCart },
  { href: "/dashboard/showroom", label: "Showroom", icon: Store },
  { href: "/dashboard/wallet", label: "Portfel", icon: Wallet },
  { href: "/dashboard/partner", label: "Moje Polecenia", icon: Handshake },
  { href: "/dashboard/mail", label: "Poczta", icon: Mail },
  { href: "/dashboard/settings", label: "Ustawienia", icon: Settings },
];

export function MobileNav({ user, urgentOrdersCount = 0, leadsCount = 0, userRoles = ['admin'] }: { user: { name?: string | null; email?: string | null; mobileMenuConfig?: string | null }, urgentOrdersCount?: number, leadsCount?: number, userRoles?: UserRole[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      // Push a new state to history when menu opens
      window.history.pushState({ menuOpen: true }, "", window.location.href);

      const handlePopState = () => {
        // Close menu when back button is pressed
        setOpen(false);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // If closing via UI (not back button), we need to revert the history push
      // Check if we are currently at the state we pushed
      if (window.history.state?.menuOpen) {
        window.history.back();
      }
    }
    setOpen(newOpen);
  };

  const isAllowed = (href: string) => {
      // Special case for Wallet & Showroom: Only show if user is explicitly an architect
      if (href === '/dashboard/wallet' || href === '/dashboard/showroom') {
          return userRoles.includes('architect');
      }

      // Special case for Partner
      if (href === '/dashboard/partner') {
          return userRoles.includes('partner');
      }

      if (userRoles.includes('partner')) {
          // Partners only see their dashboard
          return false;
      }

      if (userRoles.includes('admin')) return true;
      
      if (userRoles.includes('architect')) {
           const allowedLinks = ['/dashboard', '/dashboard/crm', '/dashboard/wallet', '/dashboard/showroom'];
           return allowedLinks.includes(href);
      }

      const restrictedLinks = ['/dashboard/erp/products', '/dashboard/shop', '/dashboard/mail', '/dashboard/settings', '/dashboard/wallet', '/dashboard/erp'];
      return !restrictedLinks.includes(href);
  };

  let displayedLinks = mainLinks.filter(link => isAllowed(link.href));

  if (user.mobileMenuConfig) {
    try {
      const parsed = typeof user.mobileMenuConfig === 'string' 
        ? JSON.parse(user.mobileMenuConfig) 
        : user.mobileMenuConfig;

      if (Array.isArray(parsed)) {
        const config = parsed as MobileMenuItem[];
        const enabledLinks = config
          .filter(item => item.visible && isAllowed(item.href))
          .map(item => ({
            href: item.href,
            label: item.label,
            icon: iconMap[item.iconName] || Home // Fallback icon
          }));
        
        if (enabledLinks.length > 0) {
          displayedLinks = enabledLinks;
        }
      }
    } catch (e) {
      console.error("Failed to parse mobile menu config", e);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t bg-background/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <nav className="flex h-16 items-center justify-around px-2">
        {displayedLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all duration-200 min-w-16 group relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {href === '/dashboard/crm/ordersWP' && urgentOrdersCount > 0 && (
                <span className="absolute top-0 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
              <div className={cn(
                "relative flex items-center justify-center transition-all duration-200",
                isActive ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"
              )}>
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-all duration-200", 
                    isActive ? "stroke-[2.5px]" : "stroke-2"
                  )} 
                />
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive ? "font-semibold" : ""
              )}>
                {label}
              </span>
            </Link>
          );
        })}
        
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all duration-200 text-muted-foreground hover:text-foreground min-w-16 group"
              )}
            >
              <div className="relative flex items-center justify-center transition-all duration-200 group-hover:-translate-y-0.5">
                <Menu className="h-6 w-6 stroke-2" />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 py-4 h-full">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted-foreground px-2">Aplikacje</p>
                    {[...mainLinks, ...menuLinks].filter(link => isAllowed(link.href)).map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname?.startsWith(href);
                        const displayLabel = (userRoles.includes('architect') && href === '/dashboard/crm') ? 'Moje Projekty' : label;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                    isActive ? "bg-muted text-primary" : "text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {displayLabel}
                                {href === '/dashboard/crm/ordersWP' && urgentOrdersCount > 0 && (
                                    <span className="ml-auto flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                                {href === '/dashboard/crm' && leadsCount > 0 && (
                                    <span className="ml-auto flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
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
