'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
    mainImage: string | null;
    galleryImages: {
        id: string;
        url: string;
        alt: string | null;
    }[];
    productName: string;
}

export function ProductGallery({ mainImage, galleryImages, productName }: ProductGalleryProps) {
    // Combine main image with standard gallery images to form a complete set, if main image exists
    const allImages = [
        ...(mainImage ? [{ id: 'main', url: mainImage, alt: productName }] : []),
        ...galleryImages
    ];

    const [selectedIndex, setSelectedIndex] = useState(0);

    if (allImages.length === 0) {
        return (
            <div className="aspect-square w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                Brak zdjęcia
            </div>
        );
    }

    const currentImage = allImages[selectedIndex];

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-white">
                <Image
                    src={currentImage.url}
                    alt={currentImage.alt || productName}
                    fill
                    className="object-contain p-4"
                    priority
                />
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {allImages.map((img, index) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white transition-all",
                                selectedIndex === index 
                                    ? "ring-2 ring-emerald-600 ring-offset-2" 
                                    : "opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img.url}
                                alt={img.alt || `Minitura ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
