'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SingleImageUploadProps {
    value?: string | null;
    onChange: (url: string | null) => void;
    onUpload: (file: File) => Promise<string>;
    onDelete?: () => void;
    disabled?: boolean;
    className?: string;
    aspectRatio?: 'square' | 'video' | 'auto';
    label?: string;
}

export function SingleImageUpload({ 
    value, 
    onChange, 
    onUpload, 
    onDelete, 
    disabled, 
    className,
    aspectRatio = 'auto',
    label = "Prześlij obraz" 
}: SingleImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so same file can be selected again if needed
        e.target.value = '';

        try {
            setIsUploading(true);
            const url = await onUpload(file);
            onChange(url);
            toast.success('Zdjęcie zostało przesłane');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Błąd podczas przesyłania zdjęcia');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        if (onDelete) {
            onDelete();
        }
        onChange(null);
    };

    const aspectRatioClasses = {
        square: 'aspect-square',
        video: 'aspect-video',
        auto: 'h-40 w-full'
    };

    return (
        <div className={cn("w-full group", className)}>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {value ? (
                <div className={cn("relative overflow-hidden rounded-lg border bg-background", aspectRatioClasses[aspectRatio])}>
                    <Image 
                        src={value} 
                        alt="Uploaded image" 
                        fill 
                        className="object-contain p-2" 
                    />
                    
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || isUploading}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleRemove}
                            disabled={disabled || isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div 
                    onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
                    className={cn(
                        "flex flex-col items-center justify-center rounded-lg border border-dashed hover:bg-accent/50 transition-colors cursor-pointer text-muted-foreground",
                        aspectRatioClasses[aspectRatio],
                        (disabled || isUploading) && "pointer-events-none opacity-50"
                    )}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span className="text-xs">Przesyłanie...</span>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-xs mt-1 opacity-70">Kliknij, aby wybrać</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
