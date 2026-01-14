'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductWeight } from "../actions";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WeightEditableFieldProps {
    productId: string;
    initialWeight: number | null;
}

export function WeightEditableField({ productId, initialWeight }: WeightEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [weight, setWeight] = useState(initialWeight?.toString() || "");
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setWeight(initialWeight?.toString() || "");
        setIsModified(false);
    }, [initialWeight]);

    async function handleSave() {
        if (!isModified) return;
        setIsLoading(true);
        try {
            const parsed = weight ? parseFloat(weight.replace(',', '.')) : null;
            if (weight && isNaN(parsed!)) {
                toast.error("Nieprawidłowa waga");
                return;
            }

            await updateProductWeight(productId, parsed);
            toast.success("Zaktualizowano wagę");
            setIsModified(false);
        } catch (error) {
            toast.error("Błąd aktualizacji");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative w-32">
            <Input 
                value={weight} 
                onChange={(e) => {
                    setWeight(e.target.value);
                    setIsModified(true);
                }}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={cn(
                    "pr-8 h-8",
                    isLoading && "opacity-50"
                )}
                placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                kg
            </span>
            {isLoading && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
            )}
             {!isLoading && isModified && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-amber-500" title="Niezapisane zmiany" />
            )}
        </div>
    );
}
