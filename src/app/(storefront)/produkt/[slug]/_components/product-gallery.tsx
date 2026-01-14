'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) => (prev + 1) % allImages.length);
    }, [allImages.length]);

    const handlePrevious = useCallback(() => {
        setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrevious]);

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
            {/* Main Image View */}
            <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border bg-white">
                <Image
                    src={currentImage.url}
                    alt={currentImage.alt || productName}
                    fill
                    className="cursor-zoom-in object-contain p-4 transition-transform duration-300 hover:scale-105"
                    priority
                    onClick={() => setIsLightboxOpen(true)}
                />
                
                {/* Navigation Arrows (visible on hover) */}
                {allImages.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 opacity-0 shadow-sm hover:bg-white group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevious();
                            }}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 opacity-0 shadow-sm hover:bg-white group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNext();
                            }}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </>
                )}

                {/* Zoom Icon */}
                <button 
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-4 right-4 rounded-full bg-white/90 p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                    <Maximize2 className="h-4 w-4 text-gray-700" />
                </button>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {allImages.map((img, index) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                selectedIndex === index 
                                    ? "border-[#b02417]" 
                                    : "border-transparent opacity-70 hover:opacity-100"
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

            {/* Lightbox Dialog */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-[90vw] h-[90vh] p-0 bg-white/95 border-none shadow-none flex flex-col items-center justify-center outline-none">
                     <DialogTitle asChild>
                        <VisuallyHidden>{productName} - Galeria</VisuallyHidden>
                    </DialogTitle>
                    
                    <button 
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-gray-500 hover:bg-white/20 hover:text-gray-900 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="relative h-full w-full flex items-center justify-center">
                         <Image
                            src={currentImage.url}
                            alt={currentImage.alt || productName}
                            fill
                            className="object-contain"
                            quality={100}
                        />
                    </div>

                    {/* Lightbox Navigation */}
                    {allImages.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/80 shadow-md hover:bg-white transition-all text-gray-800"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/80 shadow-md hover:bg-white transition-all text-gray-800"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
