"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const config = [
    {
      href: "/",
      label: "Start",
      icon: Home,
    },
    {
      href: "/kolekcje",
      label: "Kolekcje",
      icon: Grid,
    },
    {
      href: "/koszyk",
      label: "Koszyk",
      icon: ShoppingBag,
    },
    {
      href: "/ulubione",
      label: "Schowek",
      icon: Heart,
    },
    {
      href: "/konto",
      label: "Konto",
      icon: User,
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-16 grid-cols-5 items-center justify-items-center">
        {config.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:bg-muted/50",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
