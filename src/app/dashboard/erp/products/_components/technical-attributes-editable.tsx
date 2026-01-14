'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProductTechnicalAttributes } from "../actions";
import { Loader2, Settings2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TechnicalAttributesEditableProps {
    productId: string;
    mountingMethodId?: string | null;
    floorPatternId?: string | null;
    wearClassId?: string | null;
    wearLayerThickness?: number | null;
    structureId?: string | null;
    
    mountingMethods: { id: string; name: string }[];
    floorPatterns: { id: string; name: string }[];
    wearClasses: { id: string; name: string }[];
    structures: { id: string; name: string }[];
}

export function TechnicalAttributesEditable({
    productId,
    mountingMethodId: initMounting,
    floorPatternId: initPattern,
    wearClassId: initWearClass,
    wearLayerThickness: initWearLayer,
    structureId: initStructure,
    mountingMethods = [],
    floorPatterns = [],
    wearClasses = [],
    structures = []
}: TechnicalAttributesEditableProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    const [mounting, setMounting] = useState(initMounting || "none");
    const [pattern, setPattern] = useState(initPattern || "none");
    const [wearClass, setWearClass] = useState(initWearClass || "none");
    const [wearLayer, setWearLayer] = useState(initWearLayer?.toString() || "");
    const [structure, setStructure] = useState(initStructure || "none");

    const [isModified, setIsModified] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounting(initMounting || "none");
        setPattern(initPattern || "none");
        setWearClass(initWearClass || "none");
        setWearLayer(initWearLayer?.toString() || "");
        setStructure(initStructure || "none");
        setIsModified(false);
    }, [initMounting, initPattern, initWearClass, initWearLayer, initStructure]);

    // Check modification
    useEffect(() => {
        const isChanaged = 
            (mounting !== (initMounting || "none")) ||
            (pattern !== (initPattern || "none")) ||
            (wearClass !== (initWearClass || "none")) ||
            (wearLayer !== (initWearLayer?.toString() || "")) ||
            (structure !== (initStructure || "none"));
        
        setIsModified(isChanaged);
    }, [mounting, pattern, wearClass, wearLayer, structure, initMounting, initPattern, initWearClass, initWearLayer, initStructure]);

    async function handleSave() {
        setIsLoading(true);
        try {
            await updateProductTechnicalAttributes(productId, {
                mountingMethodId: mounting === "none" ? null : mounting,
                floorPatternId: pattern === "none" ? null : pattern,
                wearClassId: wearClass === "none" ? null : wearClass,
                wearLayerThickness: wearLayer ? parseFloat(wearLayer) : null,
                structureId: structure === "none" ? null : structure
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

    // Label generation for summary
    const getSummary = () => {
        const parts = [];
        // Helper to find name by ID
        const getMountingName = (id: string) => mountingMethods.find(m => m.id === id)?.name;
        const getPatternName = (id: string) => floorPatterns.find(p => p.id === id)?.name;
        const getWearClassName = (id: string) => wearClasses.find(c => c.id === id)?.name;
        const getStructureName = (id: string) => structures.find(s => s.id === id)?.name;

        if (mounting !== "none") parts.push(getMountingName(mounting));
        if (pattern !== "none") parts.push(getPatternName(pattern));
        if (wearLayer) parts.push(`Warstwa ${wearLayer}mm`);
        if (wearClass !== "none") parts.push(`Kl. ${getWearClassName(wearClass)}`);
        if (structure !== "none") parts.push(getStructureName(structure));
        
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
                                <SelectItem value="none">Brak</SelectItem>
                                {mountingMethods.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
                                <SelectItem value="none">Brak</SelectItem>
                                {floorPatterns.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                                <SelectItem value="none">Brak</SelectItem>
                                {structures.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                            <Select value={wearClass} onValueChange={setWearClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Brak</SelectItem>
                                    {wearClasses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
