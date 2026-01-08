'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingBag, Search, X, Loader2 } from 'lucide-react';
import { getAssignedProducts } from '../erp/products/actions';
import { toast } from 'sonner';
import Image from 'next/image';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { useUser } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    sku: string;
    price: string | null;
    regularPrice: string | null;
    salePrice: string | null;
    imageUrl: string | null;
    unit: string | null;
    attributes?: { name: string; options: string[] }[];
    category?: { id: string; name: string };
    categories?: { id: number; name: string }[]; // Keep for legacy compat or map it
}

const calculateBrutto = (priceStr?: string | null) => {
    if (!priceStr) return null;
    const val = parseFloat(priceStr);
    if (isNaN(val)) return null;
    return val * 1.23;
}

const formatCurrency = (val: number) => {
     return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);
}

const getInstallationMethod = (product: Product): 'CLICK' | 'KLEJONE' | null => {
    // 1. Check Category Name
    const catName = (product.category?.name || product.categories?.[0]?.name || '').toLowerCase();
    if (catName.includes('click') || catName.includes('klik')) return 'CLICK';
    if (catName.includes('klej') || catName.includes('dryback')) return 'KLEJONE';

    // 2. Check Product Name
    const name = product.name.toLowerCase();
    if (name.includes('click') || name.includes('5g') || name.includes('2g')) return 'CLICK';
    if (name.includes('klej') || name.includes('dryback')) return 'KLEJONE';

    // 3. Fallback or specific rules
    return null;
}

export default function ShowroomPage() {
    const { user } = useUser();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]); // id is string now
    const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            getAssignedProducts()
                .then((data) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setProducts(data as any[]); 
                })
                .finally(() => setIsLoading(false));
        }
    }, [user?.id]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        // Also check category names for search
        || (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        || p.categories?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Grouping Logic
    const groupedProducts = filteredProducts.reduce((acc, product) => {
        // Try new single category first, then legacy array
        let catName = 'Pozostałe';
        if (product.category) {
            catName = product.category.name;
        } else if (product.categories && product.categories.length > 0) {
            catName = product.categories[0].name;
        }
        
        if (!acc[catName]) {
            acc[catName] = [];
        }
        acc[catName].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    // Sort categories: "Pozostałe" last, others alphabetical
    const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
        if (a === 'Pozostałe') return 1;
        if (b === 'Pozostałe') return -1;
        return a.localeCompare(b);
    });

    const toggleFavorite = (id: string) => {
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
        if (!favorites.includes(id)) {
            toast.success('Dodano do Moodboardu');
        }
    };

    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-serif pb-20 md:pb-0">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b">
                <div className="max-w-7xl mx-auto px-4 h-auto py-4 md:py-0 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-auto flex items-center justify-between">
                        <h1 className="text-2xl font-medium tracking-tight">Wirtualny Showroom</h1>
                        <Button 
                            variant="outline" 
                            size="icon"
                            className="rounded-full relative md:hidden"
                            onClick={() => setIsMoodboardOpen(true)}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            {favorites.length > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                    {favorites.length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Szukaj dekoru..." 
                                className="pl-9 w-full md:w-64 bg-zinc-100 border-none rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button 
                            variant="outline" 
                            className="rounded-full relative hidden md:flex"
                            onClick={() => setIsMoodboardOpen(true)}
                        >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Moodboard
                            {favorites.length > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                    {favorites.length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">Brak produktów spełniających kryteria.</p>
                    </div>
                ) : (
                    sortedCategories.map(categoryName => (
                        <div key={categoryName} className="space-y-6">
                            <h2 className="text-xl font-medium border-b pb-2 text-zinc-800 dark:text-zinc-200">
                                {categoryName}
                                <span className="ml-2 text-sm text-muted-foreground font-normal">
                                    ({groupedProducts[categoryName].length})
                                </span>
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
                                {groupedProducts[categoryName].map((product) => (
                                    <motion.div
                                        key={`${categoryName}-${product.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="h-full flex flex-col"
                                    >
                                        <div className="group relative aspect-4/5 overflow-hidden rounded-xl bg-zinc-100 mb-4 shadow-sm hover:shadow-md transition-all">
                                            {getInstallationMethod(product) && (
                                                <div className={cn(
                                                    "absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm z-20 backdrop-blur-md border",
                                                    getInstallationMethod(product) === 'CLICK' 
                                                        ? "bg-amber-50/90 text-amber-900 border-amber-200" 
                                                        : "bg-blue-50/90 text-blue-900 border-blue-200"
                                                )}>
                                                    {getInstallationMethod(product)}
                                                </div>
                                            )}
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-50">
                                                    Brak zdjęcia
                                                </div>
                                            )}
                                            
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-white/90 hover:bg-white shadow-lg font-sans"
                                                    onClick={() => toggleFavorite(product.id)}
                                                    title={favorites.includes(product.id) ? "Usuń z moodboardu" : "Dodaj do moodboardu"}
                                                >
                                                    <Heart className={cn("h-5 w-5 transition-colors", favorites.includes(product.id) && "fill-red-500 text-red-500")} />
                                                </Button>
                                                {/* <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full h-12 w-12 bg-white/90 hover:bg-white shadow-lg"
                                                    onClick={() => toast.success('Pobieranie tekstur...')}
                                                >
                                                    <Download className="h-5 w-5" />
                                                </Button> */}
                                            </div>

                                            {/* Mobile Favorite Indicator (always visible if favorite) */}
                                            {favorites.includes(product.id) && (
                                                <div className="absolute top-2 right-2 md:hidden">
                                                    <div className="bg-white/90 rounded-full p-1.5 shadow-sm">
                                                        <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto space-y-1">
                                            <h3 className="font-medium text-lg leading-tight line-clamp-2" title={product.name}>{product.name}</h3>
                                            <p className="text-sm text-muted-foreground font-sans truncate">SKU: {product.sku}</p>
                                            
                                            {/* Price Display */}
                                            <div className="pt-1">
                                                {(() => {
                                                    const currentBrutto = calculateBrutto(product.price);
                                                    const oldBrutto = calculateBrutto(product.regularPrice);
                                                    const isPromo = product.salePrice && product.price !== product.regularPrice;

                                                    if (!currentBrutto) return null;

                                                    return (
                                                        <div className="font-sans">
                                                            {isPromo && oldBrutto ? (
                                                                <div className="flex items-baseline gap-2">
                                                                     <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                        {formatCurrency(currentBrutto)}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground line-through">
                                                                        {formatCurrency(oldBrutto)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                                    {formatCurrency(currentBrutto)}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground ml-1">brutto / {product.unit || 'szt'}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Attributes pills */}
                                            {/* <div className="flex flex-wrap gap-1 mt-2">
                                                {product.attributes?.slice(0, 2).map(attr => (
                                                    <span key={attr.name} className="text-[10px] uppercase tracking-wider bg-zinc-100 px-2 py-1 rounded-sm text-zinc-600 font-sans">
                                                        {attr.options[0]}
                                                    </span>
                                                ))}
                                            </div> */}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Moodboard Drawer */}
            <Sheet open={isMoodboardOpen} onOpenChange={setIsMoodboardOpen}>
                <SheetContent className="w-full sm:max-w-md flex flex-col">
                    <SheetHeader>
                        <SheetTitle className="font-serif text-2xl">Twój Moodboard</SheetTitle>
                        <SheetDescription>
                            Wybrane produkty ({favorites.length}).
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
                        {favoriteProducts.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                Twój moodboard jest pusty.
                            </div>
                        ) : (
                            favoriteProducts.map(p => (
                                <div key={p.id} className="flex gap-4 items-center p-3 bg-zinc-50 rounded-lg border">
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                                        {p.imageUrl && (
                                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{p.name}</h4>
                                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleFavorite(p.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <SheetFooter className="flex-col gap-3 sm:flex-col">
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            disabled={favorites.length === 0}
                            onClick={() => toast.info('Generowanie PDF w przygotowaniu')}
                        >
                            Pobierz Karty Produktów (PDF)
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
