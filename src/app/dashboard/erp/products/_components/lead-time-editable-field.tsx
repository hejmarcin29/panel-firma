'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductLeadTime } from "../actions";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LeadTimeEditableFieldProps {
    productId: string;
    initialLeadTime: string | null;
}

export function LeadTimeEditableField({ productId, initialLeadTime }: LeadTimeEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [leadTime, setLeadTime] = useState(initialLeadTime || "");
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setLeadTime(initialLeadTime || "");
        setIsModified(false);
    }, [initialLeadTime]);

    async function handleSave() {
        if (!isModified) return;
        setIsLoading(true);
        try {
            await updateProductLeadTime(productId, leadTime || null);
            toast.success("Zaktualizowano czas realizacji");
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
        <div className="relative w-40">
            <Input 
                value={leadTime} 
                onChange={(e) => {
                    setLeadTime(e.target.value);
                    setIsModified(true);
                }}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={cn(
                    "text-blue-600 font-medium h-8",
                    isLoading && "opacity-50"
                )}
                placeholder="np. 3-5 dni"
            />
            {isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
            )}
            {!isLoading && isModified && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-500" title="Niezapisane zmiany" />
            )}
        </div>
    );
}
