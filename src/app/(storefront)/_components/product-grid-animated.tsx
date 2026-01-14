"use client";

import { motion } from "framer-motion";
import { ProductCard } from "./product-card";

interface ProductGridAnimatedProps {
    products: any[]; // We can refine this type if needed, but for now passing through is fine
    showGrossPrices: boolean;
    vatRate: number;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
};

export function ProductGridAnimated({ products, showGrossPrices, vatRate }: ProductGridAnimatedProps) {
    if (products.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
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
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {products.map((product) => (
                <motion.div key={product.id} variants={item}>
                    <ProductCard 
                        product={product} 
                        showGrossPrices={showGrossPrices}
                        vatRate={vatRate}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}
