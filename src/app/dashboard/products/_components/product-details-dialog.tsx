"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { WooCommerceProduct } from "../actions";

interface ProductDetailsDialogProps {
  product: WooCommerceProduct | null;
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function ProductDetailsDialog({ product, isOpen, onClose }: ProductDetailsDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl">{product.name}</DialogTitle>
          <DialogDescription>
            SKU: {product.sku || 'Brak'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left Column: Image */}
            <div className="space-y-4">
                {product.images && product.images.length > 0 ? (
                    <div className="aspect-square relative rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={product.images[0].src} 
                            alt={product.images[0].alt || product.name}
                            className="object-contain max-w-full max-h-full"
                        />
                    </div>
                ) : (
                    <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
                        Brak zdjęcia
                    </div>
                )}
                
                {/* Categories */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Kategorie</h4>
                    <div className="flex flex-wrap gap-2">
                        {product.categories.map(cat => (
                            <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Cena</h4>
                        <div className="flex flex-col mt-1">
                            <span className="text-2xl font-bold">
                                {product.price ? `${parseFloat(product.price).toFixed(2)} zł` : '-'}
                            </span>
                            <span className="text-xs text-muted-foreground">netto</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Stan magazynowy</h4>
                        <div className="flex flex-col mt-1 gap-1">
                            <Badge className="w-fit" variant={product.stock_status === 'instock' ? 'default' : 'destructive'}>
                                {product.stock_status === 'instock' ? 'Dostępny' : 'Brak'}
                            </Badge>
                            {product.manage_stock && (
                                <span className="text-sm text-muted-foreground">{product.stock_quantity} szt.</span>
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
                            <div key={attr.id} className="flex justify-between text-sm border-b pb-2 last:border-0 border-border/50">
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
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-[200px] text-[10px]">
                            {JSON.stringify(product, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
