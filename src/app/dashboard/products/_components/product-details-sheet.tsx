"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { WooCommerceProduct } from "../actions";

interface ProductDetailsSheetProps {
  product: WooCommerceProduct | null;
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function ProductDetailsSheet({ product, isOpen, onClose }: ProductDetailsSheetProps) {
  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{product.name}</SheetTitle>
          <SheetDescription>
            SKU: {product.sku || 'Brak'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
            {/* Image */}
            {product.images && product.images.length > 0 && (
                <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={product.images[0].src} 
                        alt={product.images[0].alt || product.name}
                        className="object-contain w-full h-full"
                    />
                </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Cena</h4>
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold">
                            {product.price ? `${parseFloat(product.price).toFixed(2)} zł` : '-'}
                        </span>
                        <span className="text-xs text-muted-foreground">netto</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Stan magazynowy</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={product.stock_status === 'instock' ? 'default' : 'destructive'}>
                            {product.stock_status === 'instock' ? 'Dostępny' : 'Brak'}
                        </Badge>
                        {product.manage_stock && (
                            <span className="text-sm text-muted-foreground">({product.stock_quantity} szt.)</span>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Attributes */}
            <div>
                <h4 className="text-sm font-medium mb-3">Atrybuty</h4>
                <div className="grid grid-cols-1 gap-2">
                    {product.attributes.map((attr) => (
                        <div key={attr.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                            <span className="text-muted-foreground">{attr.name}:</span>
                            <span className="font-medium text-right">{attr.options.join(', ')}</span>
                        </div>
                    ))}
                    {product.attributes.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">Brak atrybutów</p>
                    )}
                </div>
            </div>

             <Separator />
             
             {/* Categories */}
             <div>
                <h4 className="text-sm font-medium mb-2">Kategorie</h4>
                <div className="flex flex-wrap gap-2">
                    {product.categories.map(cat => (
                        <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                    ))}
                </div>
             </div>

             <Separator />

             {/* Dimensions */}
             <div>
                <h4 className="text-sm font-medium mb-2">Wymiary i Waga</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Waga:</span>
                        <span className="ml-2 font-medium">{product.weight || '-'} kg</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Wymiary:</span>
                        <span className="ml-2 font-medium">
                            {product.dimensions.length || '-'} x {product.dimensions.width || '-'} x {product.dimensions.height || '-'} cm
                        </span>
                    </div>
                </div>
             </div>

            {/* Debug / Raw Data */}
            <div className="pt-4 border-t mt-4">
                <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground select-none">Pokaż surowe dane (JSON)</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-[300px] text-[10px]">
                        {JSON.stringify(product, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
