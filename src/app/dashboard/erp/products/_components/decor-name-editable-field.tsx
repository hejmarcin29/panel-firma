'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductDecorName } from "../actions";
import { Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DecorNameEditableFieldProps {
    productId: string;
    initialDecorName: string | null;
}

export function DecorNameEditableField({ productId, initialDecorName }: DecorNameEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState(initialDecorName || "");
    const [isModified, setIsModified] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setValue(initialDecorName || "");
        setIsModified(false);
    }, [initialDecorName]);

    async function handleSave() {
        if (!isModified) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await updateProductDecorName(productId, value || null);
            toast.success("Nazwa dekoru zaktualizowana");
            setIsModified(false);
            setIsEditing(false);
        } catch (error) {
            toast.error("Błąd aktualizacji nazwy");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isEditing) {
        return (
            <div 
                onClick={() => setIsEditing(true)}
                className="group flex items-center gap-2 cursor-pointer py-1 px-2 -ml-2 rounded hover:bg-gray-100 transition-colors"
                title="Kliknij, aby edytować nazwę dekoru"
            >
                <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500">Nazwa dekoru (Grupowanie): </span>
                    <span className={cn("text-base font-semibold", !value && "text-gray-400 italic")}>
                        {value || "(brak - kliknij aby dodać)"}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 max-w-md">
            <Input 
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setIsModified(true);
                }}
                className="h-8 shadow-none"
                placeholder="Np. Bali Jodełka"
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                        setValue(initialDecorName || "");
                        setIsEditing(false);
                    }
                }}
            />
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={handleSave}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
            </Button>
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={() => {
                    setValue(initialDecorName || "");
                    setIsEditing(false);
                }}
                disabled={isLoading}
            >
                <X className="h-4 w-4 text-red-500" />
            </Button>
        </div>
    );
}
