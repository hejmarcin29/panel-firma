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

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {/* Read only view */}
                    <span className="text-muted-foreground">Montaż:</span>
                    <span>{mountingMethods.find(m => m.id === initMounting)?.name || "-"}</span>

                    <span className="text-muted-foreground">Wzór:</span>
                    <span>{floorPatterns.find(p => p.id === initPattern)?.name || "-"}</span>

                    <span className="text-muted-foreground">Klasa:</span>
                    <span>{wearClasses.find(c => c.id === initWearClass)?.name || "-"}</span>
                    
                    <span className="text-muted-foreground">Warstwa:</span>
                    <span>{initWearLayer ? `${initWearLayer} mm` : "-"}</span>

                    <span className="text-muted-foreground">Struktura:</span>
                    <span>{structures.find(s => s.id === initStructure)?.name || "-"}</span>
                </div>
            </div>

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Parametry techniczne</h4>
                            <p className="text-sm text-muted-foreground">
                                Zmień parametry techniczne produktu.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="mounting">Montaż</Label>
                                <Select value={mounting} onValueChange={setMounting}>
                                    <SelectTrigger className="col-span-2 h-8">
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
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="pattern">Wzór</Label>
                                <Select value={pattern} onValueChange={setPattern}>
                                    <SelectTrigger className="col-span-2 h-8">
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
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="class">Klasa</Label>
                                <Select value={wearClass} onValueChange={setWearClass}>
                                    <SelectTrigger className="col-span-2 h-8">
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
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="wear">Warstwa</Label>
                                <div className="col-span-2 flex items-center gap-2">
                                    <Input
                                        id="wear"
                                        type="number"
                                        step="0.05"
                                        className="h-8"
                                        value={wearLayer}
                                        onChange={(e) => setWearLayer(e.target.value)}
                                    />
                                    <span className="text-xs text-muted-foreground">mm</span>
                                </div>
                            </div>
                             <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="structure">Struktura</Label>
                                <Select value={structure} onValueChange={setStructure}>
                                    <SelectTrigger className="col-span-2 h-8">
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
                        </div>

                        {isModified && (
                            <Button size="sm" onClick={handleSave} disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Zapisz zmiany
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}        } finally {
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
