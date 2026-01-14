'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadProductGallery, deleteProductImage } from "../actions";

interface GalleryImage {
    id: string;
    url: string;
    alt: string | null;
}

interface ProductGalleryProps {
    productId: string;
    images: GalleryImage[];
}

export function ProductGallery({ productId, images }: ProductGalleryProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach((file) => {
            formData.append('files', file);
        });

        try {
            const result = await uploadProductGallery(productId, formData);
            if (result.success) {
                toast.success(`Wgrano ${result.count} zdjęć`);
                // Reset input
                e.target.value = '';
            }
        } catch (error) {
            console.error(error);
            toast.error("Błąd podczas wgrywania zdjęć");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDelete(imageId: string) {
        if (!confirm("Czy na pewno chcesz usunąć to zdjęcie?")) return;

        setIsDeleting(imageId);
        try {
            const result = await deleteProductImage(imageId, productId);
            if (result.success) {
                toast.success("Zdjęcie usunięte");
            } else {
                toast.error("Nie udało się usunąć zdjęcia");
            }
        } catch (error) {
            console.error(error);
            toast.error("Błąd podczas usuwania");
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Galeria Produktu</CardTitle>
                        <CardDescription>
                            Zarządzaj dodatkowymi zdjęciami produktu (np. aranżacje, detale).
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="font-medium">Przetwarzanie i wysyłanie...</span>
                            </>
                        ) : (
                            <>
                                <ImagePlus className="h-8 w-8" />
                                <span className="font-medium">Upuść zdjęcia tutaj lub kliknij</span>
                                <span className="text-xs">Obsługuje wiele plików naraz (JPG, PNG, WebP)</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="group relative aspect-square rounded-md border overflow-hidden bg-white shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={img.url} 
                                    alt={img.alt || "Gallery image"} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                        variant="destructive" 
                                        size="icon"
                                        onClick={() => handleDelete(img.id)}
                                        disabled={isDeleting === img.id}
                                    >
                                        {isDeleting === img.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        Brak zdjęć w galerii.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
