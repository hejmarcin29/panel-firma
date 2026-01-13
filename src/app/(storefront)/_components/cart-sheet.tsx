'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cart-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export function CartSheet() {
  const { 
    isOpen, 
    setOpen, 
    items, 
    removeItem, 
    updateQuantity, 
    getTotalPrice 
  } = useCartStore();
  
  // Hydration fix for zustand persist check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Twój Koszyk ({items.length})
          </SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-6">
            <div className="relative h-40 w-40 opacity-20">
              <ShoppingBag className="h-full w-full" />
            </div>
            <p className="text-xl font-medium text-muted-foreground">
              Twój koszyk jest pusty
            </p>
            <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="mt-4"
            >
              Wróć do sklepu
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-6 -mr-6">
              <div className="flex flex-col gap-6 py-6 pl-1 pr-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    {/* Image */}
                    <div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Brak zdjęcia
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold leading-tight line-clamp-2 text-sm md:text-base">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.unit === 'm2' && item.packageSize ? (
                            <>
                                Opakowanie: {item.packageSize} m² <br/>
                                Razem: {(item.quantity * item.packageSize).toFixed(3)} m²
                            </>
                          ) : (
                            <>SKU: {item.sku}</>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-md border bg-white p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                            <div className="font-semibold">
                                {formatCurrency(item.pricePerUnit * item.quantity)}
                            </div>
                            {item.quantity > 1 && (
                                <div className="text-[10px] text-muted-foreground">
                                    {formatCurrency(item.pricePerUnit)} / szt.
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="space-y-4 pr-6 bg-white pt-4 pb-4 border-t">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Wartość produktów</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Do zapłaty (brutto)</span>
                  <span className="text-xl text-emerald-700">{formatCurrency(getTotalPrice())}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Koszty dostawy zostaną obliczone w następnym kroku.
                </p>
              </div>
              
              <Button size="lg" className="w-full h-12 text-base" asChild onClick={() => setOpen(false)}>
                <Link href="/checkout">
                    Przejdź do kasy
                    <ShoppingBag className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
