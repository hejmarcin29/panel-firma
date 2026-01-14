'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductTechnicalAttributes } from "../actions";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";

// Import types from schema if possible, or define them here matching the DB enums/logic
// From schema: 
// productPatterns = ['plank', 'herringbone', 'chevron', 'tile']
// productMountingMethods = ['click', 'glue', 'auto']

const MOUNTING_METHODS = [
    { value: 'click', label: 'Klik (Pływający)' },
    { value: 'glue', label: 'Klejony' },
    { value: 'auto', label: 'Automatyczny' }
];

const PATTERNS = [
    { value: 'plank', label: 'Deska (Klaszyczny)' },
    { value: 'herringbone', label: 'Jodełka' },
    { value: 'chevron', label: 'Jodełka Francuska' },
    { value: 'tile', label: 'Płytka' }
];

const STRUCTURES = [
    { value: 'wood', label: 'Drewno' },
    { value: 'stone', label: 'Kamień / Beton' }
];

interface TechnicalAttributesEditableProps {
    productId: string;
    mountingMethod?: string | null;
    floorPattern?: string | null;
    wearClass?: string | null;
    wearLayerThickness?: number | null;
    structure?: string | null;
}

export function TechnicalAttributesEditable({
    productId,
    mountingMethod: initMounting,
    floorPattern: initPattern,
    wearClass: initWearClass,
    wearLayerThickness: initWearLayer,
    structure: initStructure
}: TechnicalAttributesEditableProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    const [mounting, setMounting] = useState(initMounting || "");
    const [pattern, setPattern] = useState(initPattern || "");
    const [wearClass, setWearClass] = useState(initWearClass || "");
    const [wearLayer, setWearLayer] = useState(initWearLayer?.toString() || "");
    const [structure, setStructure] = useState(initStructure || "");

    const [isModified, setIsModified] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounting(initMounting || "");
        setPattern(initPattern || "");
        setWearClass(initWearClass || "");
        setWearLayer(initWearLayer?.toString() || "");
        setStructure(initStructure || "");
        setIsModified(false);
    }, [initMounting, initPattern, initWearClass, initWearLayer, initStructure]);

    // Check modification
    useEffect(() => {
        const isChanaged = 
            (mounting !== (initMounting || "")) ||
            (pattern !== (initPattern || "")) ||
            (wearClass !== (initWearClass || "")) ||
            (wearLayer !== (initWearLayer?.toString() || "")) ||
            (structure !== (initStructure || ""));
        
        setIsModified(isChanaged);
    }, [mounting, pattern, wearClass, wearLayer, structure, initMounting, initPattern, initWearClass, initWearLayer, initStructure]);

    async function handleSave() {
        setIsLoading(true);
        try {
            await updateProductTechnicalAttributes(productId, {
                mountingMethod: mounting || null,
                floorPattern: pattern || null,
                wearClass: wearClass || null,
                wearLayerThickness: wearLayer ? parseFloat(wearLayer) : null,
                structure: structure || null
            });
            toast.success("Dane techniczne zaktualizowane");
            setIsModified(false);
            setIsOpen(false);
        } catch (error) {
            toast.error("Błąd aktualizacji danych technicznych");
        } finally {
            setIsLoading(false);
        }
    }

    // Label generation
    const getSummary = () => {
        const parts = [];
        if (mounting) parts.push(MOUNTING_METHODS.find(m => m.value === mounting)?.label || mounting);
        if (pattern) parts.push(PATTERNS.find(p => p.value === pattern)?.label || pattern);
        if (wearLayer) parts.push(`Warstwa ${wearLayer}mm`);
        if (wearClass) parts.push(`Kl. ${wearClass}`);
        if (structure) parts.push(STRUCTURES.find(s => s.value === structure)?.label || structure);
        
        return parts.length > 0 ? parts.join(" • ") : "Brak danych technicznych";
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="group cursor-pointer rounded-md border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <Label className="cursor-pointer text-muted-foreground group-hover:text-foreground">Parametry Techniczne</Label>
                        <Settings2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="font-medium truncate text-sm">
                        {getSummary()}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Edytuj parametry</h4>
                    
                    {/* Mounting Method */}
                    <div className="space-y-2">
                        <Label>Sposób Montażu</Label>
                        <Select value={mounting} onValueChange={setMounting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOUNTING_METHODS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pattern */}
                    <div className="space-y-2">
                        <Label>Wzór</Label>
                        <Select value={pattern} onValueChange={setPattern}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {PATTERNS.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                     {/* Structure */}
                     <div className="space-y-2">
                        <Label>Struktura</Label>
                        <Select value={structure} onValueChange={setStructure}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {STRUCTURES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Wear Layer */}
                        <div className="space-y-2">
                            <Label>Warstwa (mm)</Label>
                            <Input 
                                value={wearLayer} 
                                onChange={(e) => setWearLayer(e.target.value)} 
                                placeholder="0.55"
                                type="number"
                                step="0.05"
                            />
                        </div>

                        {/* Wear Class */}
                        <div className="space-y-2">
                            <Label>Klasa</Label>
                            <Input 
                                value={wearClass} 
                                onChange={(e) => setWearClass(e.target.value)} 
                                placeholder="23/33"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                            Anuluj
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isLoading || !isModified}>
                            {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            <Save className="mr-2 h-3 w-3" />
                            Zapisz
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
