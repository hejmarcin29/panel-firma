"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Loader2, Info } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Define types based on what we fetch
type ExplorerProduct = {
    id: string;
    name: string;
    decorName: string | null;
    slug: string | null;
    imageUrl: string | null;
    price: string | number | null;
    salePrice: string | number | null;
    unit: string | null;
    collection: { name: string } | null;
    mountingMethodDictionary: { name: string; slug: string | null } | null;
    floorPatternDictionary: { name: string; slug: string | null } | null;
    wearClassDictionary: { name: string; slug: string | null } | null;
};

// Initial tabs configuration (images will be replaced dynamically)
const INITIAL_TABS = [
    { id: 'all', label: 'Wszystkie', filterFn: () => true },
    { id: 'classic', label: 'Klasyczne', filterFn: (p: ExplorerProduct) => {
        const pattern = p.floorPatternDictionary?.slug?.toLowerCase() || '';
        return !pattern.includes('herring') && !pattern.includes('jod') && !pattern.includes('chevron') && !pattern.includes('tile') && !pattern.includes('stone') && !pattern.includes('beton') && !pattern.includes('plytka');
    }},
    { id: 'herringbone', label: 'Jodełka', filterFn: (p: ExplorerProduct) => {
        const pattern = p.floorPatternDictionary?.slug?.toLowerCase() || '';
        return pattern.includes('herring') || pattern.includes('jod') || pattern.includes('chevron');
    }},
    { id: 'tile', label: 'Płytka / Kamień', filterFn: (p: ExplorerProduct) => {
        const pattern = p.floorPatternDictionary?.slug?.toLowerCase() || '';
        return pattern.includes('tile') || pattern.includes('stone') || pattern.includes('beton') || pattern.includes('plytka');
    }},
];

export function HeroProductExplorer({ products }: { products: ExplorerProduct[] }) {
    const [activeTab, setActiveTab] = useState('all');
    const [visibleCount, setVisibleCount] = useState(16);
    const [selectedGroup, setSelectedGroup] = useState<ExplorerProduct[] | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Compute dynamic tabs with images from products
    const tabs = INITIAL_TABS.map(tab => {
        // Find a representative product for this tab to use as image
        const representativeProduct = products.find(p => tab.filterFn(p) && p.imageUrl);
        return {
            ...tab,
            // Fallback image if no product matches (e.g. empty category)
            icon: representativeProduct?.imageUrl || 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2684&auto=format&fit=crop'
        };
    });

    // Filter logic
    const filteredProducts = products.filter(p => {
        const currentTab = INITIAL_TABS.find(t => t.id === activeTab);
        return currentTab ? currentTab.filterFn(p) : true;
    });

    // Grouping Logic
    const groupedItems = filteredProducts.reduce((acc, product) => {
        const key = product.decorName || `single-${product.id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
    }, {} as Record<string, ExplorerProduct[]>);

    const allGroups = Object.values(groupedItems);
    const displayGroups = allGroups.slice(0, visibleCount); 
    const hasMore = visibleCount < allGroups.length;

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setVisibleCount(16); // Reset visible count on tab change
    };

    const handleCardClick = (e: React.MouseEvent, group: ExplorerProduct[]) => {
        if (group.length > 1) {
            e.preventDefault();
            setSelectedGroup(group);
            setIsSheetOpen(true);
        }
    };
    
    // Helper to get representative product for a group
    const getRepresentative = (group: ExplorerProduct[]) => group[0];

    return (
        <section className="py-8 md:py-12 border-b bg-white/50 backdrop-blur-sm relative z-10 -mt-8 mx-0 sm:mx-4 md:mx-0 sm:rounded-3xl md:rounded-none md:mt-0 shadow-xl md:shadow-none border md:border-t-0 md:bg-white md:backdrop-blur-none">
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto rounded-t-3xl">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-playfair font-bold">
                            {selectedGroup && selectedGroup[0].decorName}
                        </SheetTitle>
                        <SheetDescription>
                            Wybierz wariant produktu z tej kolekcji
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                        {selectedGroup?.map(product => (
                            <Link 
                                key={product.id} 
                                href={`/produkt/${product.slug ?? '#'}`}
                                onClick={() => setIsSheetOpen(false)}
                                className="flex sm:block gap-4 p-3 rounded-xl border hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                            >
                                <div className="relative h-20 w-20 sm:h-40 sm:w-full bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                     {product.imageUrl && (
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                     )}
                                </div>
                                <div className="flex-1 sm:mt-3">
                                    <div className="text-xs text-emerald-600 font-medium mb-1">
                                        {product.wearClassDictionary?.name}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-emerald-700">
                                        {product.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-2">{product.floorPatternDictionary?.name}</p>
                                    <div className="font-bold text-lg">
                                        {formatCurrency(product.price ? Number(product.price) : 0)}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <div className="container space-y-6 md:space-y-8 px-0 sm:px-4 md:px-6">
                {/* Header & Tabs */}
                <div className="flex flex-col gap-6 px-4 md:px-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-600 font-medium">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs uppercase tracking-wider">Odkrywaj kolekcje</span>
                        </div>
                        <h2 className="text-3xl font-bold font-playfair text-gray-900">
                            Znajdź swoją podłogę
                        </h2>
                    </div>

                    {/* NEW: Horizontal Story-like Tabs (Squircle) */}
                    <div 
                        className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
                        data-vaul-no-drag
                    >
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className="flex flex-col items-center gap-2 min-w-[60px] group"
                                >
                                    <div className={cn(
                                        "relative h-[60px] w-[60px] rounded-[20px] overflow-hidden transition-all duration-300 shadow-sm",
                                        isActive 
                                            ? "ring-2 ring-emerald-600 ring-offset-2 scale-105" 
                                            : "ring-1 ring-gray-100 opacity-90 group-hover:scale-105 group-hover:opacity-100"
                                    )}>
                                        <Image
                                            src={tab.icon}
                                            alt={tab.label}
                                            fill
                                            className="object-cover"
                                            sizes="60px"
                                        />
                                        {isActive && <div className="absolute inset-0 bg-emerald-900/10" />}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-medium text-center leading-tight transition-colors whitespace-nowrap",
                                        isActive ? "text-emerald-700 font-semibold" : "text-gray-500"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Counter & Status (Desktop only or Hidden on Mobile for clean look?) -> Let's keep but style it */}
                <div className="hidden md:flex justify-between items-center text-sm text-muted-foreground border-b pb-4 mx-4 md:mx-0">
                    <p>
                        Wyświetlam <strong className="text-foreground">{displayGroups.length}</strong> z <strong>{allGroups.length}</strong> propozycji
                    </p>
                    <Link href="/sklep" className="flex items-center hover:text-emerald-600 transition-colors group">
                        Przejdź do pełnej oferty <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Vertical list on mobile is replaced by Horizontal Slider */}
                <div className="relative w-full">
                    <motion.div 
                        layout
                        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-8 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:pb-0 md:px-0 no-scrollbar"
                    >
                        <AnimatePresence mode="popLayout">
                            {displayGroups.map((group) => {
                                const product = getRepresentative(group);
                                const isGroup = group.length > 1;
                                
                                return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="snap-center shrink-0 w-[85vw] sm:w-[45vw] md:w-auto group relative block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                                >
                                    <Link 
                                        href={isGroup ? '#' : `/produkt/${product.slug ?? '#'}`}
                                        onClick={(e) => handleCardClick(e, group)}
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[4/5] md:aspect-4/3 overflow-hidden bg-gray-100">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 85vw, (max-width: 1200px) 50vw, 25vw"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                    Brak zdjęcia
                                                </div>
                                            )}
                                            
                                            {/* Overlay Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                            {/* Top Badges */}
                                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                                {product.wearClassDictionary && (
                                                    <div className="bg-white/90 backdrop-blur-md text-xs font-semibold px-2 py-1 rounded shadow-sm text-gray-900 border">
                                                        {product.wearClassDictionary.name}
                                                    </div>
                                                )}
                                                {isGroup && (
                                                    <div className="bg-emerald-500/90 backdrop-blur-md text-xs font-semibold px-2 py-1 rounded shadow-sm text-white border border-emerald-400 flex items-center gap-1">
                                                        <Info className="h-3 w-3" />
                                                        {group.length} warianty
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                {product.collection && (
                                                    <div className="text-[10px] uppercase tracking-widest font-semibold text-emerald-300 mb-1">
                                                        {product.collection.name}
                                                    </div>
                                                )}
                                                <h3 className="font-playfair text-xl md:text-xl font-bold leading-tight mb-3 truncate pr-4">
                                                    {product.decorName || product.name}
                                                </h3>
                                                
                                                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="font-bold text-lg">
                                                            {formatCurrency(product.price ? Number(product.price) : 0)}
                                                        </span>
                                                        <span className="text-[10px] opacity-80 font-medium">
                                                            / {product.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                        <Plus className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );})}
                        </AnimatePresence>
                    </motion.div>
                </div>
                
                {hasMore && (
                    <div className="flex justify-center pt-2 md:pt-8 border-t border-gray-100 md:border-none">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setVisibleCount(prev => prev + 16)}
                            className="min-w-[200px] gap-2 rounded-full hidden md:flex"
                        >
                            <Loader2 className="h-4 w-4 animate-spin hidden" />
                            Załaduj więcej
                        </Button>
                        {/* Mobile Load More - simpler */}
                         <Button 
                            variant="ghost" 
                            onClick={() => setVisibleCount(prev => prev + 16)}
                            className="md:hidden text-emerald-600 font-medium"
                        >
                            Pokaż więcej produktów
                        </Button>
                    </div>
                )}

                {displayGroups.length === 0 && (
                     <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-xl mx-4 md:mx-0">
                        Brak produktów spełniających kryteria w tej sekcji.
                        <Link href="/sklep" className="block mt-2 text-emerald-600 underline">
                            Zobacz wszystkie produkty w sklepie
                        </Link>
                     </div>
                )}
            </div>
        </section>
    );
}
