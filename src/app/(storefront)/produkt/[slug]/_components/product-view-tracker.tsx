'use client';

import { useEffect } from 'react';
import { useInteractionStore } from '@/store/interaction-store';

interface ProductViewTrackerProps {
    product: {
        id: string;
        name: string;
        price: number;
        slug: string;
        imageUrl: string;
    };
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
    const addProductVisit = useInteractionStore((state) => state.addProductVisit);

    useEffect(() => {
        addProductVisit(product);
    }, [product, addProductVisit]);

    return null;
}
