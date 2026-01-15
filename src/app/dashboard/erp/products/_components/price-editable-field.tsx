'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductSalesPrice } from "../actions";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceEditableFieldProps {
    productId: string;
    initialPrice: string | null;
    unit: string | null;
}

export function PriceEditableField({ productId, initialPrice, unit }: PriceEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [price, setPrice] = useState(initialPrice || "");
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setPrice(initialPrice || "");
        setIsModified(false);
    }, [initialPrice]);

    async function handleSave() {
        if (!isModified) return;

        setIsLoading(true);
        try {
            // Replace comma with dot for DB storage
            const normalizedPrice = price.replace(',', '.');
            // Validate basic number
            if (normalizedPrice && isNaN(parseFloat(normalizedPrice))) {
                toast.error("Nieprawidłowy format ceny");
                setIsLoading(false);
                return;
            }

            await updateProductSalesPrice(productId, normalizedPrice || null);
            toast.success("Cena zaktualizowana");
            setIsModified(false);
        } catch (error) {
            toast.error("Błąd aktualizacji ceny");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(e.target.value);
        setIsModified(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
            (e.target as HTMLInputElement).blur();
        }
    };

    const unitMap: Record<string, string> = {
        'm2': 'm²',
        'szt': 'szt',
        'mb': 'mb',
        'kpl': 'kpl',
        'opak': 'op.',
    };

    const displayUnit = unitMap[unit || 'szt'] || unit || 'szt';

    const parsedPrice = parseFloat(price.replace(',', '.')) || 0;
    const fmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="relative w-40">
                    <Input 
                        value={price} 
                        onChange={handleChange}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className={cn(
                            "pr-16 text-right font-medium",
                            isLoading && "opacity-50"
                        )}
                        placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        zł / {displayUnit}
                    </div>
                </div>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isLoading && isModified && <div className="h-2 w-2 rounded-full bg-amber-500" title="Niezapisane zmiany" />}
            </div>
            
            {parsedPrice > 0 && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex justify-between w-40 px-1">
                        <span>23% VAT:</span>
                        <span className="font-medium">{fmt.format(parsedPrice * 1.23)}</span>
                    </div>
                    <div className="flex justify-between w-40 px-1">
                        <span>8% VAT:</span>
                        <span className="font-medium">{fmt.format(parsedPrice * 1.08)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
