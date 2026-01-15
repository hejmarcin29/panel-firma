"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Define types based on what we fetch
type ExplorerProduct = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    price: number | null;
    salePrice: number | null;
    unit: string;
    collection: { name: string } | null;
    mountingMethodDictionary: { name: string; slug: string } | null;
    floorPatternDictionary: { name: string; slug: string } | null;
    wearClassDictionary: { name: string; slug: string } | null;
};

const TABS = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'classic', label: 'Klasyczne' },
    { id: 'herringbone', label: 'Jodełka' },
    { id: 'tile', label: 'Płytka / Kamień' },
];

export function HeroProductExplorer({ products }: { products: ExplorerProduct[] }) {
    const [activeTab, setActiveTab] = useState('all');
    const [visibleCount, setVisibleCount] = useState(16);

    // Filter logic
    const filteredProducts = products.filter(p => {
        if (activeTab === 'all') return true;
        const pattern = p.floorPatternDictionary?.slug?.toLowerCase() || '';
        
        if (activeTab === 'herringbone') return pattern.includes('herring') || pattern.includes('jod') || pattern.includes('chevron');
        if (activeTab === 'tile') return pattern.includes('tile') || pattern.includes('stone') || pattern.includes('beton') || pattern.includes('plytka');
        if (activeTab === 'classic') return !pattern.includes('herring') && !pattern.includes('jod') && !pattern.includes('chevron') && !pattern.includes('tile') && !pattern.includes('stone') && !pattern.includes('beton') && !pattern.includes('plytka');
        
        return true;
    });

    const displayProducts = filteredProducts.slice(0, visibleCount); 
    const hasMore = visibleCount < filteredProducts.length;

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setVisibleCount(16); // Reset visible count on tab change
    };

    return (
        <section className="py-12 border-b bg-white/50 backdrop-blur-sm relative z-10 -mt-8 mx-4 md:mx-0 rounded-3xl md:rounded-none md:mt-0 shadow-xl md:shadow-none border md:border-t-0 md:bg-white md:backdrop-blur-none">
            <div className="container space-y-8">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "relative px-4 py-2 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
                                    activeTab === tab.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="explorer-tab"
                                        className="absolute inset-0 bg-gray-900 rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Counter & Status */}
                <div className="flex justify-between items-center text-sm text-muted-foreground border-b pb-4">
                    <p>
                        Wyświetlam <strong className="text-foreground">{displayProducts.length}</strong> z <strong>{filteredProducts.length}</strong> propozycji
                    </p>
                    <Link href="/sklep" className="flex items-center hover:text-emerald-600 transition-colors group">
                        Przejdź do pełnej oferty <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Grid with Layout Animations */}
                <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {displayProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="group relative block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                                <Link href={`/produkt/${product.slug}`}>
                                    {/* Image */}
                                    <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                                        {product.imageUrl ? (
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                Brak zdjęcia
                                            </div>
                                        )}
                                        
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        {/* Top Badges */}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                            {product.wearClassDictionary && (
                                                <div className="bg-white/90 backdrop-blur-md text-xs font-semibold px-2 py-1 rounded shadow-sm text-gray-900 border">
                                                    {product.wearClassDictionary.name}
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
                                            <h3 className="font-playfair text-xl font-bold leading-tight mb-3 truncate pr-4">
                                                {product.name}
                                            </h3>
                                            
                                            <div className="flex items-center justify-between border-t border-white/20 pt-3">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="font-bold text-lg">
                                                        {formatCurrency(product.price)}
                                                    </span>
                                                    <span className="text-[10px] opacity-80 font-medium">
                                                        / {product.unit}
                                                    </span>
                                                </div>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
                
                {hasMore && (
                    <div className="flex justify-center pt-8 border-t border-gray-100">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setVisibleCount(prev => prev + 16)}
                            className="min-w-[200px] gap-2 rounded-full"
                        >
                            <Loader2 className="h-4 w-4 animate-spin hidden" />
                            Załaduj więcej
                        </Button>
                    </div>
                )}

                {displayProducts.length === 0 && (
                     <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-xl">
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
