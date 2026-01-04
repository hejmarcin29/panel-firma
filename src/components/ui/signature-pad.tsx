'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SignaturePadProps {
    onSave: (signatureData: string) => Promise<void> | void;
    className?: string;
}

export function SignaturePad({ onSave, className }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasSignature, setHasSignature] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                // h-48 is 12rem. 1rem = 16px usually. 12 * 16 = 192px.
                // Subtract borders (2px + 2px) = 4px? No, offsetWidth includes border.
                // Inner width is what matters for canvas if we want it to fit perfectly.
                // But setting canvas width/height sets the coordinate space.
                setCanvasSize({ width: width - 4, height: 192 - 4 }); 
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        
        // Also update after a short delay to handle modal animations
        const timeout = setTimeout(updateSize, 100);
        const timeout2 = setTimeout(updateSize, 500);

        return () => {
            window.removeEventListener('resize', updateSize);
            clearTimeout(timeout);
            clearTimeout(timeout2);
        };
    }, []);

    const clear = () => {
        sigCanvas.current?.clear();
        setHasSignature(false);
    };

    const save = async () => {
        if (!sigCanvas.current) return;
        
        if (sigCanvas.current.isEmpty()) {
            toast.error("Proszę złożyć podpis przed zatwierdzeniem.");
            return;
        }

        setIsSaving(true);
        try {
            // Try to get trimmed canvas first
            let dataUrl;
            try {
                dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            } catch (e) {
                console.warn("Failed to get trimmed canvas, falling back to full canvas", e);
                // Fallback to full canvas if trimming fails
                const canvas = sigCanvas.current.getCanvas(); 
                dataUrl = canvas.toDataURL('image/png');
            }
            
            await onSave(dataUrl);
        } catch (error) {
            console.error("Error saving signature:", error);
            toast.error("Wystąpił błąd podczas zapisywania podpisu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnd = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            setHasSignature(true);
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div ref={containerRef} className="border-2 border-dashed border-gray-300 rounded-lg bg-white h-48 overflow-hidden">
                {canvasSize.width > 0 && (
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                            width: canvasSize.width,
                            height: canvasSize.height,
                            className: "cursor-crosshair block"
                        }}
                        onEnd={handleEnd}
                    />
                )}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>Podpisz w ramce powyżej</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clear} disabled={!hasSignature || isSaving}>
                        <Eraser className="w-4 h-4 mr-2" />
                        Wyczyść
                    </Button>
                    <Button size="sm" onClick={save} disabled={!hasSignature || isSaving}>
                        {isSaving ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Zapisywanie...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Zatwierdź podpis
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
