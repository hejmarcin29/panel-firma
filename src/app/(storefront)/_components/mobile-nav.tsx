"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { useEffect, useState } from "react";
import { ContactDrawer } from "@/components/storefront/contact-drawer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CartIconWrapper({ item }: { item: any }) {
    const { toggleCart, getTotalItems } = useCartStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);
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
  const [isContactOpen, setIsContactOpen] = useState(false);

  const config = [
    {
      href: "/",
      label: "Start",
      icon: Home,
    },
    {
      href: "/sklep",
      label: "Oferta",
      icon: Grid,
    },
    {
      href: "/koszyk",
      label: "Koszyk",
      icon: ShoppingBag,
    },
    {
      href: "/montaz",
      label: "Montaż",
      icon: Grid
    },
    {
      href: "#contact-drawer", // Special trigger
      label: "Kontakt",
      icon: Phone,
    }
  ];

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 z-49 border-t bg-white/95 backdrop-blur-xl supports-backdrop-filter:bg-white/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] md:hidden rounded-t-[20px]">
      <div className="grid h-[70px] grid-cols-5 items-center justify-items-center px-2">
        {config.map((item) => {
          const Icon = item.icon;

          // Special logic for Cart (Counter)
          if (item.href === "/koszyk") {
             return (
               <CartIconWrapper key={item.href} item={item} />
             )
          }

          // Special logic for Contact (Drawer)
          if (item.href === "#contact-drawer") {
              return (
                <button
                    key={item.href}
                    onClick={() => setIsContactOpen(true)}
                    className="flex h-full w-full flex-col items-center justify-center space-y-1 text-[10px] font-medium transition-all active:scale-95 text-muted-foreground hover:text-primary"
                >
                    <div className="p-1.5 rounded-xl bg-slate-100 transition-colors group-hover:bg-primary/10">
                         <Icon className="h-5 w-5" />
                    </div>
                    <span>{item.label}</span>
                </button>
              )
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 text-[10px] font-medium transition-all active:scale-95",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-slate-600"
              )}
            >
              <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10 text-primary scale-110" : "bg-transparent"
              )}>
                 <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              </div>
              <span className={isActive ? "scale-105" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>

    {/* Contact Drawer Component */}
    <ContactDrawer open={isContactOpen} onOpenChange={setIsContactOpen} />
    </>
  );
}
