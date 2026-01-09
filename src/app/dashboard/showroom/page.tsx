'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/sheet';
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

    // Sort categories: 'Pozostałe' last, others alphabetical
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
        <div className='max-w-7xl mx-auto p-6 md:p-10 space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row justify-between items-start md:items-end gap-4'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight text-zinc-900'>Wirtualny Showroom</h1>
                    <p className='text-zinc-500 mt-1'>Przeglądaj katalog produktów i twórz moodboardy.</p>
                </div>
                <div className='flex items-center gap-3 w-full md:w-auto'>
                    <div className='relative flex-1 md:w-64'>
                         <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400' />
                         <Input 
                            placeholder='Szukaj...' 
                            className='pl-9 bg-white border-zinc-200 rounded-full shadow-sm focus-visible:ring-indigo-500' 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                        className='rounded-full bg-zinc-900 text-white hover:bg-zinc-800 relative shadow-sm'
                        onClick={() => setIsMoodboardOpen(true)}
                    >
                        <ShoppingBag className='h-4 w-4 md:mr-2' />
                        <span className='hidden md:inline'>Moodboard</span>
                        {favorites.length > 0 && (
                            <span className='absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white'>
                                {favorites.length}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Grid Content */}
            <div className='space-y-12 min-h-[500px]'>
                {isLoading ? (
                    <div className='flex items-center justify-center h-64'>
                        <Loader2 className='h-8 w-8 animate-spin text-zinc-300' />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className='flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50'>
                        <Search className='h-12 w-12 text-zinc-300 mb-4' />
                        <h3 className='text-lg font-medium text-zinc-900'>Brak wyników</h3>
                        <p className='text-zinc-500 mt-2'>Nie znaleziono produktów dla Twojego zapytania.</p>
                    </div>
                ) : (
                    sortedCategories.map(categoryName => (
                        <div key={categoryName} className='space-y-6'>
                            <div className='flex items-center gap-4'>
                                <h2 className='text-xl font-bold text-zinc-900'>
                                    {categoryName}
                                </h2>
                                <span className='px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium'>
                                    {groupedProducts[categoryName].length}
                                </span>
                                <div className='h-px bg-zinc-100 flex-1' />
                            </div>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {groupedProducts[categoryName].map((product) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4 }}
                                        className='group flex flex-col bg-white rounded-2xl border border-zinc-200 p-3 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 transition-all duration-300'
                                    >
                                        <div className='relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100 mb-4'>
                                            {getInstallationMethod(product) && (
                                                <div className={cn(
                                                    'absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm z-20 backdrop-blur-md border',
                                                    getInstallationMethod(product) === 'CLICK' 
                                                        ? 'bg-amber-50/90 text-amber-900 border-amber-200' 
                                                        : 'bg-blue-50/90 text-blue-900 border-blue-200'
                                                )}>
                                                    {getInstallationMethod(product)}
                                                </div>
                                            )}
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className='object-cover transition-transform duration-700 group-hover:scale-105'
                                                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                                                />
                                            ) : (
                                                <div className='w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50'>
                                                    Brak zdjęcia
                                                </div>
                                            )}
                                            
                                            {/* Overlay Actions */}
                                            <div className='absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3'>
                                                <Button
                                                    size='icon'
                                                    variant='secondary'
                                                    className='rounded-full h-10 w-10 bg-white shadow-xl hover:bg-zinc-50 hover:scale-110 transition-all duration-200'
                                                    onClick={() => toggleFavorite(product.id)}
                                                >
                                                    <Heart className={cn('h-5 w-5 transition-colors', favorites.includes(product.id) && 'fill-rose-500 text-rose-500')} />
                                                </Button>
                                            </div>

                                            {/* Mobile Favorite Indicator */}
                                            {favorites.includes(product.id) && (
                                                <div className='absolute top-2 right-2 md:hidden'>
                                                    <div className='bg-white/90 rounded-full p-1.5 shadow-sm'>
                                                        <Heart className='h-3 w-3 fill-rose-500 text-rose-500' />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className='mt-auto space-y-1 px-1 pb-1'>
                                            <h3 className='font-bold text-zinc-900 leading-snug line-clamp-2 text-sm' title={product.name}>{product.name}</h3>
                                            <p className='text-xs text-zinc-400 font-medium font-mono'>SKU: {product.sku}</p>
                                            
                                            {/* Price Display */}
                                            <div className='pt-2 mt-2 border-t border-dashed border-zinc-100'>
                                                {(() => {
                                                    const currentBrutto = calculateBrutto(product.price);
                                                    const oldBrutto = calculateBrutto(product.regularPrice);
                                                    const isPromo = product.salePrice && product.price !== product.regularPrice;

                                                    if (!currentBrutto) return null;

                                                    return (
                                                        <div className='flex items-center justify-between'>
                                                            {isPromo && oldBrutto ? (
                                                                <div className='flex flex-col'>
                                                                     <span className='font-bold text-zinc-900'>
                                                                        {formatCurrency(currentBrutto)}
                                                                    </span>
                                                                    <span className='text-[10px] text-zinc-400 line-through'>
                                                                        {formatCurrency(oldBrutto)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className='font-bold text-zinc-900'>
                                                                    {formatCurrency(currentBrutto)}
                                                                </span>
                                                            )}
                                                            <span className='text-[10px] text-zinc-400 uppercase font-medium bg-zinc-50 px-1.5 py-0.5 rounded'>{product.unit || 'szt'}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
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
                <SheetContent className='w-full sm:max-w-md flex flex-col p-0 gap-0'>
                    <SheetHeader className='p-6 border-b border-zinc-100'>
                        <SheetTitle className='text-xl font-bold'>Twój Moodboard</SheetTitle>
                        <SheetDescription>
                            Wybrane produkty ({favorites.length}).
                        </SheetDescription>
                    </SheetHeader>

                    <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50'>
                        {favoriteProducts.length === 0 ? (
                            <div className='flex flex-col items-center justify-center h-48 text-zinc-400'>
                                <ShoppingBag className='h-8 w-8 mb-2 opacity-50' />
                                <p>Twój moodboard jest pusty.</p>
                            </div>
                        ) : (
                            favoriteProducts.map(p => (
                                <div key={p.id} className='flex gap-4 items-center p-3 bg-white rounded-xl border border-zinc-200 shadow-sm'>
                                    <div className='relative h-16 w-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100'>
                                        {p.imageUrl && (
                                            <Image src={p.imageUrl} alt={p.name} fill className='object-cover' />
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h4 className='font-bold text-sm text-zinc-900 truncate'>{p.name}</h4>
                                        <p className='text-xs text-zinc-500 font-mono'>{p.sku}</p>
                                    </div>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full'
                                        onClick={() => toggleFavorite(p.id)}
                                    >
                                        <X className='h-4 w-4' />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <SheetFooter className='p-6 border-t border-zinc-100 bg-white'>
                        <Button 
                            className='w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800' 
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
