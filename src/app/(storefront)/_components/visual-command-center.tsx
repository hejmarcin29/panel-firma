'use client';

import { Drawer } from 'vaul';
import { Menu, Search, History, Sparkles, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useInteractionStore, VisitedProduct } from '@/store/interaction-store';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

interface VisualCommandCenterProps {
    bestsellers: {
        id: string;
        name: string;
        slug: string;
        images: unknown; // can be string[] or json
        price?: number; // Optional if we want to show price
    }[];
}

export function VisualCommandCenter({ bestsellers }: VisualCommandCenterProps) {
    const [open, setOpen] = useState(false);
    const { visitedProducts } = useInteractionStore();
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setOpen(false);
            router.push(`/sklep?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    // Helpler to parse image
    const getImageUrl = (images: unknown) => {
        if (Array.isArray(images) && images.length > 0) return images[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof images === 'string') {
             try {
                const parsed = JSON.parse(images);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
             } catch {}
             return images; // fallback if it's a simple string url
        }
        return '/placeholder.png';
    };

    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[92vh] flex-col rounded-t-[10px] bg-background outline-none">
                    <div className="flex-1 rounded-t-[10px] bg-background p-4">
                        <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                        
                        {/* Search Section */}
                        <div className="mb-6">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Czego szukasz?"
                                    className="w-full rounded-xl border-0 bg-muted/50 py-3 pl-10 pr-4 text-base font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus // Auto focus on open if desired, but might be annoying on mobile
                                />
                            </form>
                        </div>

                        <ScrollArea className="h-[calc(100vh-220px)] pr-4">
                            <div className="space-y-8">
                                
                                {/* Quick Navigation */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Link 
                                        href="/sklep" 
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent"
                                    >
                                        <span className="mb-1 text-2xl">🛍️</span>
                                        <span className="font-medium">Wszystkie produkty</span>
                                    </Link>
                                    <Link 
                                        href="/kolekcje" 
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent"
                                    >
                                        <span className="mb-1 text-2xl">✨</span>
                                        <span className="font-medium">Kolekcje</span>
                                    </Link>
                                </div>

                                {/* Bestsellers */}
                                {bestsellers.length > 0 && (
                                    <section>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Polecane
                                            </h3>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {bestsellers.map((product) => (
                                                <Link 
                                                    key={product.id} 
                                                    href={`/produkt/${product.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="relative flex min-w-[140px] snap-start flex-col gap-2 rounded-lg border bg-card p-2"
                                                >
                                                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                                                        <Image
                                                            src={getImageUrl(product.images)}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform hover:scale-105"
                                                            sizes="140px"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="line-clamp-2 text-xs font-medium">{product.name}</h4>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* History */}
                                {mounted && visitedProducts.length > 0 && (
                                    <section>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                                <History className="h-4 w-4 text-blue-500" />
                                                Ostatnio oglądane
                                            </h3>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-auto px-2 py-0 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    useInteractionStore.getState().clearHistory();
                                                }}
                                            >
                                                Wyczyść
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {visitedProducts.slice(0, 5).map((product) => (
                                                <Link 
                                                    key={product.id}
                                                    href={`/produkt/${product.slug}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent"
                                                >
                                                    <div className="relative aspect-square w-12 overflow-hidden rounded-md bg-muted">
                                                        <Image
                                                            src={product.imageUrl || '/placeholder.png'}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center">
                                                        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">Zobacz ponownie</p>
                                                    </div>
                                                    <ChevronRight className="my-auto h-4 w-4 text-muted-foreground/50" />
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Menu Links */}
                                <div className="space-y-1 pt-4">
                                     <Link href="/kontakt" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Kontakt
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                     <Link href="/blog" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Blog & Porady
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                     <Link href="/dlaczego-my" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                                        Dlaczego My?
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                     </Link>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
