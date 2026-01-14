'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductDimensions } from "../actions";
import { Loader2, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DimensionsEditableFieldProps {
    productId: string;
    width: number | null;
    height: number | null;
    length: number | null;
}

export function DimensionsEditableField({ productId, width: initialWidth, height: initialHeight, length: initialLength }: DimensionsEditableFieldProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Values in local state (strings to handle empty/custom inputs comfortably)
    const [width, setWidth] = useState(initialWidth?.toString() || "");
    const [height, setHeight] = useState(initialHeight?.toString() || "");
    const [length, setLength] = useState(initialLength?.toString() || "");
    
    const [isModified, setIsModified] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setWidth(initialWidth?.toString() || "");
        setHeight(initialHeight?.toString() || "");
        setLength(initialLength?.toString() || "");
        setIsModified(false);
    }, [initialWidth, initialHeight, initialLength]);

    async function handleSave() {
        setIsLoading(true);
        try {
            await updateProductDimensions(
                productId, 
                length ? parseFloat(length) : null,
                width ? parseFloat(width) : null,
                height ? parseFloat(height) : null
            );
            toast.success("Wymiary zaktualizowane");
            setIsModified(false);
            setIsOpen(false);
        } catch (error) {
            toast.error("Błąd aktualizacji wymiarów");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleChange = (setter: (v: string) => void, value: string) => {
        setter(value);
        setIsModified(true);
    };

    const displayString = [
        length ? `Dł: ${length}mm` : null,
        width ? `Szer: ${width}mm` : null,
        height ? `Gr: ${height}mm` : null
    ].filter(Boolean).join(' x ');

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer group hover:bg-muted/50 p-1 rounded -ml-1">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium border-b border-dashed border-transparent group-hover:border-muted-foreground transition-colors">
                        {displayString || "Ustaw wymiary"}
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Wymiary Produktu (mm)</h4>
                        <p className="text-sm text-muted-foreground">
                            Podaj wartości w milimetrach.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="length">Długość</Label>
                            <Input
                                id="length"
                                value={length}
                                onChange={(e) => handleChange(setLength, e.target.value)}
                                className="col-span-2 h-8"
                                placeholder="np. 1200"
                                type="number"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="width">Szerokość</Label>
                            <Input
                                id="width"
                                value={width}
                                onChange={(e) => handleChange(setWidth, e.target.value)}
                                className="col-span-2 h-8"
                                placeholder="np. 200"
                                type="number"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="height">Grubość</Label>
                            <Input
                                id="height"
                                value={height}
                                onChange={(e) => handleChange(setHeight, e.target.value)}
                                className="col-span-2 h-8"
                                placeholder="np. 8"
                                type="number"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                         <Button onClick={handleSave} disabled={isLoading || !isModified} size="sm">
                            {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Zapisz
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
