'use client';

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateProductUnit } from "../actions";
import { Loader2 } from "lucide-react";

interface UnitEditableFieldProps {
    productId: string;
    initialUnit: string | null;
}

const COMMON_UNITS = [
    { value: 'szt', label: 'szt' },
    { value: 'm2', label: 'm2' },
    { value: 'mb', label: 'mb' },
    { value: 'kpl', label: 'kpl' },
    { value: 'opak', label: 'opak' },
];

export function UnitEditableField({ productId, initialUnit }: UnitEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    async function handleUnitChange(newUnit: string) {
        setIsLoading(true);
        try {
            await updateProductUnit(productId, newUnit);
            toast.success("Jednostka zaktualizowana");
        } catch (error) {
            toast.error("Błąd aktualizacji jednostki");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Select 
                defaultValue={initialUnit || 'szt'} 
                onValueChange={handleUnitChange}
                disabled={isLoading}
            >
                <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue placeholder="Jm" />
                </SelectTrigger>
                <SelectContent>
                    {COMMON_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
    );
}
