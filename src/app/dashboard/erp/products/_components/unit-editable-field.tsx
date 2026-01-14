'use client';

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateProductUnit } from "../actions";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRODUCT_UNITS } from "@/lib/constants";

interface UnitEditableFieldProps {
    productId: string;
    initialUnit: string | null;
    initialPackageSizeM2?: number | null;
}

const COMMON_UNITS = PRODUCT_UNITS;

export function UnitEditableField({ productId, initialUnit, initialPackageSizeM2 }: UnitEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [unit, setUnit] = useState(initialUnit || 'szt');
    const [packageSize, setPackageSize] = useState(initialPackageSizeM2?.toString() || "");
    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        setUnit(initialUnit || 'szt');
        setPackageSize(initialPackageSizeM2?.toString() || "");
    }, [initialUnit, initialPackageSizeM2]);

    async function handleSave() {
        setIsLoading(true);
        try {
            const parsedSize = unit === 'm2' && packageSize ? parseFloat(packageSize) : null;
            await updateProductUnit(productId, unit, parsedSize);
            toast.success("Zaktualizowano");
            setIsModified(false);
        } catch (error) {
            toast.error("Błąd aktualizacji");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUnitChange = (val: string) => {
        setUnit(val);
        setIsModified(true);
        // If changing away from m2, we can auto-save immediately nicely? 
        // Or keep consistency and require save. 
        // Let's require save if it was 'm2' (to confirm packet size removal) or is 'm2' (to enter size).
        // Actually simpler: Just show Save button if modified.
    };

    const handleSizeChange = (val: string) => {
        setPackageSize(val);
        setIsModified(true);
    };

    return (
        <div className="flex items-center gap-2">
            <Select 
                value={unit}
                onValueChange={handleUnitChange}
                disabled={isLoading}
            >
                <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue placeholder="Jm" />
                </SelectTrigger>
                <SelectContent>
                    {COMMON_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                            {u.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {unit === 'm2' && (
                <div className="flex flex-col gap-1">
                    <div className="relative" title="Ilość metrów kwadratowych w paczce">
                        <Input 
                            className="h-8 w-24 text-xs pr-8" 
                            placeholder="m2/op."
                            value={packageSize}
                            onChange={(e) => handleSizeChange(e.target.value)}
                            type="number"
                            step="0.0001"
                        />
                         <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">m²</span>
                    </div>
                </div>
            )}

            {isModified && (
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
            )}
        </div>
    );
}
