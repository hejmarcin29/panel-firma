"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { useEffect, useState } from "react";

function CartIconWrapper({ item }: { item: any }) {
    const { toggleCart, getTotalItems } = useCartStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const count = mounted ? getTotalItems() : 0;
    const Icon = item.icon;

    return (
        <button
            onClick={toggleCart}
            className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:bg-muted/50 text-muted-foreground relative"
            )}
        >
            <div className="relative">
                <Icon className="h-5 w-5" />
                {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {count}
                    </span>
                )}
            </div>
            <span>{item.label}</span>
        </button>
    );
}

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
          const Icon = item.icon;

          // Special logic for Cart
          if (item.href === "/koszyk") {
             return (
               <CartIconWrapper key={item.href} item={item} />
             )
          }

          const isActive = pathname === item.href;

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
