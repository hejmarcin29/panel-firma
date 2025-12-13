'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Download, ShoppingBag, Search, Filter, X, ArrowRight, Loader2 } from 'lucide-react';
import { getAssignedProducts } from '../products/actions';
import { requestSamples } from './actions';
import { toast } from 'sonner';
import Image from 'next/image';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { useUser } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    images: { src: string }[];
    attributes: { name: string; options: string[] }[];
}

export default function ShowroomPage() {
    const { user } = useUser();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<number[]>([]);
    const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            getAssignedProducts(user.id)
                .then((data) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setProducts(data as any[]); // Casting because of type mismatch in action return vs interface
                })
                .finally(() => setIsLoading(false));
        }
    }, [user?.id]);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFavorite = (id: number) => {
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
        if (!favorites.includes(id)) {
            toast.success('Dodano do Moodboardu');
        }
    };

    const handleRequestSamples = async () => {
        try {
            setIsLoading(true);
            await requestSamples(favorites);
            toast.success('Wysłano prośbę o próbki do opiekuna handlowego.');
            setFavorites([]);
            setIsMoodboardOpen(false);
        } catch (error) {
            toast.error('Wystąpił błąd podczas wysyłania prośby.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-serif">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <h1 className="text-2xl font-medium tracking-tight">Wirtualny Showroom</h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Szukaj dekoru..." 
                                className="pl-9 w-64 bg-zinc-100 border-none rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button 
                            variant="outline" 
                            className="rounded-full relative"
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
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">Brak produktów spełniających kryteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100 mb-4">
                                    {product.images[0] ? (
                                        <Image
                                            src={product.images[0].src}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            Brak zdjęcia
                                        </div>
                                    )}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white"
                                            onClick={() => toggleFavorite(product.id)}
                                        >
                                            <Heart className={cn("h-5 w-5", favorites.includes(product.id) && "fill-red-500 text-red-500")} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white"
                                            onClick={() => toast.success('Pobieranie tekstur...')}
                                        >
                                            <Download className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-medium text-lg leading-tight">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground font-sans">SKU: {product.sku}</p>
                                    {/* Attributes pills */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {product.attributes.slice(0, 2).map(attr => (
                                            <span key={attr.name} className="text-[10px] uppercase tracking-wider bg-zinc-100 px-2 py-1 rounded-sm text-zinc-600 font-sans">
                                                {attr.options[0]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Moodboard Drawer */}
            <Sheet open={isMoodboardOpen} onOpenChange={setIsMoodboardOpen}>
                <SheetContent className="w-full sm:max-w-md flex flex-col">
                    <SheetHeader>
                        <SheetTitle className="font-serif text-2xl">Twój Moodboard</SheetTitle>
                        <SheetDescription>
                            Wybrane produkty ({favorites.length}). Możesz zamówić próbki lub pobrać materiały.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-6 space-y-4">
                        {favoriteProducts.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                Twój moodboard jest pusty.
                            </div>
                        ) : (
                            favoriteProducts.map(p => (
                                <div key={p.id} className="flex gap-4 items-center p-3 bg-zinc-50 rounded-lg border">
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                                        {p.images[0] && (
                                            <Image src={p.images[0].src} alt={p.name} fill className="object-cover" />
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
                        <Button className="w-full h-12 text-base" onClick={handleRequestSamples} disabled={favorites.length === 0}>
                            Zamów Próbki (Kurier)
                        </Button>
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
