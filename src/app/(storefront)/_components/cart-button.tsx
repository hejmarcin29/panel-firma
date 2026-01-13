"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { cn } from "@/lib/utils";

export function CartButton({ className, minimal = false }: { className?: string; minimal?: boolean }) {
  const { toggleCart, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const count = mounted ? getTotalItems() : 0;

  if (minimal) {
    return (
        <button className={cn("relative p-2", className)} onClick={toggleCart}>
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
                <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                    {count}
                </span>
            )}
        </button>
    )
  }

  return (
    <Button variant="outline" size="icon" className={cn("relative", className)} onClick={toggleCart}>
      <ShoppingCart className="h-5 w-5" />
      <span className="sr-only">Koszyk</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-in zoom-in">
          {count}
        </span>
      )}
    </Button>
  );
}
