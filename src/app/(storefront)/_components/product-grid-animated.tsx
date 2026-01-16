"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./product-card";

interface ProductGridAnimatedProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: any[]; 
    showGrossPrices: boolean;
    vatRate: number;
}

export function ProductGridAnimated({ products, showGrossPrices, vatRate }: ProductGridAnimatedProps) {
    // Fallback for empty state
    if (!products || products.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-24 text-center border rounded-lg bg-muted/20"
            >
                <p className="text-muted-foreground text-lg">
                    Brak produktów spełniających kryteria wyszukiwania.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                    Spróbuj zmienić kategorię lub wyczyścić filtry.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6"
            layout
        >
            <AnimatePresence mode="popLayout">
                {products.map((product) => (
                    <motion.div 
                        key={product.id} 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.3 }
                        }}
                    >
                        <ProductCard 
                            product={product} 
                            showGrossPrices={showGrossPrices}
                            vatRate={vatRate}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}

