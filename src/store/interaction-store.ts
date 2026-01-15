import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisitedProduct = {
    id: string;
    name: string;
    price: number;
    slug: string;
    imageUrl: string;
    visitedAt: number;
};

interface InteractionState {
    visitedProducts: VisitedProduct[];
    addProductVisit: (product: Omit<VisitedProduct, 'visitedAt'>) => void;
    clearHistory: () => void;
}

export const useInteractionStore = create<InteractionState>()(
    persist(
        (set) => ({
            visitedProducts: [],
            addProductVisit: (product) => {
                const now = Date.now();
                set((state) => {
                    // Remove existing entry for the same product id to push it to the top
                    const filtered = state.visitedProducts.filter(p => p.id !== product.id);
                    // Add new entry to the beginning
                    const newHistory = [
                        { ...product, visitedAt: now },
                        ...filtered
                    ].slice(0, 10); // Keep only last 10 items
                    
                    return { visitedProducts: newHistory };
                });
            },
            clearHistory: () => set({ visitedProducts: [] }),
        }),
        {
            name: 'user-interaction-storage', // key in localStorage
        }
    )
);
