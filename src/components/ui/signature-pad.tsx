'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    className?: string;
}

export function SignaturePad({ onSave, className }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [hasSignature, setHasSignature] = useState(false);

    const clear = () => {
        sigCanvas.current?.clear();
        setHasSignature(false);
    };

    const save = () => {
        if (sigCanvas.current) {
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    const handleEnd = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            setHasSignature(true);
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: "w-full h-48 rounded-lg cursor-crosshair block"
                    }}
                    onEnd={handleEnd}
                />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>Podpisz w ramce powyżej</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clear} disabled={!hasSignature}>
                        <Eraser className="w-4 h-4 mr-2" />
                        Wyczyść
                    </Button>
                    <Button size="sm" onClick={save} disabled={!hasSignature}>
                        <Check className="w-4 h-4 mr-2" />
                        Zatwierdź podpis
                    </Button>
                </div>
            </div>
        </div>
    );
}
