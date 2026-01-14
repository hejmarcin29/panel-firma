"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string | null;
    imageUrl: string | null;
    price: string | null;
    salePrice: string | null;
    unit: string | null;
    isPurchasable?: boolean | null;
    isSampleAvailable?: boolean | null;
  };
  showGrossPrices?: boolean;
  vatRate?: number;
}

export function ProductCard({ product, showGrossPrices = false, vatRate = 23 }: ProductCardProps) {
  let price = product.price ? parseFloat(product.price) : null;
  let salePrice = product.salePrice ? parseFloat(product.salePrice) : null;

  // Apply VAT logic if enabled
  if (showGrossPrices) {
      const multiplier = 1 + (vatRate / 100);
      if (price) price = price * multiplier;
      if (salePrice) salePrice = salePrice * multiplier;
  }

  const currentPrice = salePrice || price;
  
  const isOnSale = salePrice && price && salePrice < price;

  const productUrl = `/produkt/${product.slug || product.id}`;

  return (
    <Link href={productUrl} className="group h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Brak zdjęcia
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
             {isOnSale && (
                <Badge variant="destructive" className="font-semibold">
                    Promocja
                </Badge>
             )}
             {product.isSampleAvailable && (
                 <Badge variant="secondary" className="bg-white/90 text-xs backdrop-blur-sm">
                     Próbka dostępna
                 </Badge>
             )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-lg font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          
          <div className="mt-auto pt-4">
             <div className="flex items-end justify-between">
                <div>
                    {currentPrice ? (
                        <div className="flex flex-col">
                            {isOnSale && price && (
                                <span className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(price)}
                                </span>
                            )}
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(currentPrice)}
                                </span>
                                {product.unit && (
                                    <span className="text-sm text-muted-foreground">
                                        / {product.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                            Wycena indywidualna
                        </span>
                    )}
                </div>
                
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100">
                    <ShoppingCart className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
