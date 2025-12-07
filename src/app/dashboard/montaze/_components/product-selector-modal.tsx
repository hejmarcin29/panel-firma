'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Check } from 'lucide-react';
import { getMontageProducts } from '../actions';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    imageUrl: string | null;
    stockStatus: string | null;
    stockQuantity: number | null;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productName: string) => void;
  type: 'panel' | 'skirting';
  currentValue?: string;
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelect,
  type,
  currentValue
}: ProductSelectorModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getMontageProducts(type)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, type]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Wybierz {type === 'panel' ? 'model paneli' : 'model listew'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie lub SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mt-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>Brak produktów do wyświetlenia.</p>
                    <p className="text-sm">Upewnij się, że produkty są oznaczone jako "Do montażu" w panelu produktów.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id}
                            className={cn(
                                "border rounded-lg p-3 cursor-pointer transition-all hover:border-primary hover:bg-accent/50 flex flex-col gap-2",
                                currentValue === product.name && "border-primary bg-accent ring-1 ring-primary"
                            )}
                            onClick={() => {
                                onSelect(product.name);
                                onClose();
                            }}
                        >
                            <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                                {product.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                        Brak zdjęcia
                                    </div>
                                )}
                                {currentValue === product.name && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                                            <Check className="h-6 w-6" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{product.sku || 'Brak SKU'}</span>
                                    {product.stockQuantity !== null && (
                                        <span className={product.stockQuantity > 0 ? "text-green-600" : "text-red-600"}>
                                            {product.stockQuantity} szt.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
