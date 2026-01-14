import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { bulkEditProducts, BulkEditData } from "../actions";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

interface Props {
    selectedIds: string[];
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    collections: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
    attributes: { 
        id: string; 
        name: string; 
        options: { id: string; value: string }[] 
    }[];
    mountingMethods: { id: string; name: string }[];
    floorPatterns: { id: string; name: string }[];
    wearClasses: { id: string; name: string }[];
    structures: { id: string; name: string }[];
    onSuccess: () => void;
}

export function BulkEditDialog({ 
    selectedIds, 
    categories, 
    brands, 
    collections, 
    suppliers, 
    attributes, 
    mountingMethods,
    floorPatterns,
    wearClasses,
    structures,
    onSuccess 
}: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // States for enabled fields
    const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
    
    // Form data
    const [formData, setFormData] = useState<{
        categoryId?: string;
        brandId?: string;
        collectionId?: string;
        supplierId?: string;
        status?: string;
        packageSizeM2?: string;
        price?: string;
        mountingMethodId?: string;
        floorPatternId?: string;
        wearClassId?: string;
        wearLayerThickness?: string;
        structureId?: string;
    }>({});

    // Attributes to update
    const [selectedAttributes, setSelectedAttributes] = useState<{ attributeId: string; value: string }[]>([]);

    const handleFieldToggle = (field: string, enabled: boolean) => {
         setEnabledFields(prev => ({ ...prev, [field]: enabled }));
         if (!enabled) {
             // Clear value if disabled
             setFormData(prev => {
                const rest = { ...prev };
                delete rest[field as keyof typeof rest];
                return rest;
             });
         }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const payload: BulkEditData = {};
            if (enabledFields.categoryId) payload.categoryId = formData.categoryId;
            if (enabledFields.brandId) payload.brandId = formData.brandId;
            if (enabledFields.collectionId) payload.collectionId = formData.collectionId;
            if (enabledFields.supplierId) payload.supplierId = formData.supplierId;
            if (enabledFields.status) payload.status = formData.status;
            if (enabledFields.packageSizeM2) payload.packageSizeM2 = parseFloat(formData.packageSizeM2 || '0');
            if (enabledFields.price) payload.price = formData.price;
            
            // Tech attrs
            if (enabledFields.mountingMethod) payload.mountingMethodId = formData.mountingMethodId;
            if (enabledFields.floorPattern) payload.floorPatternId = formData.floorPatternId;
            if (enabledFields.wearClass) payload.wearClassId = formData.wearClassId;
            if (enabledFields.wearLayerThickness) payload.wearLayerThickness = formData.wearLayerThickness ? parseFloat(formData.wearLayerThickness) : null;
            if (enabledFields.structure) payload.structureId = formData.structureId;

            if (selectedAttributes.length > 0) {
                payload.attributes = selectedAttributes;
            }

            await bulkEditProducts(selectedIds, payload);
            toast.success("Zaktualizowano produkty");
            setOpen(false);
            onSuccess();
        } catch (e) {
            console.error(e);
            toast.error("Wystąpił błąd podczas aktualizacji");
        } finally {
            setLoading(false);
        }
    };

    const addAttribute = () => {
        setSelectedAttributes([...selectedAttributes, { attributeId: "", value: "" }]);
    };

    const removeAttribute = (index: number) => {
        const newAttrs = [...selectedAttributes];
        newAttrs.splice(index, 1);
        setSelectedAttributes(newAttrs);
    };

    const updateAttribute = (index: number, field: 'attributeId' | 'value', val: string) => {
        const newAttrs = [...selectedAttributes];
        newAttrs[index] = { ...newAttrs[index], [field]: val };
        setSelectedAttributes(newAttrs);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edytuj zaznaczone ({selectedIds.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Masowa edycja produktów</DialogTitle>
                    <DialogDescription>
                        Zaznacz pola, które chcesz zaktualizować dla {selectedIds.length} produktów.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Category */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-category" 
                            checked={enabledFields.categoryId} 
                            onCheckedChange={(c) => handleFieldToggle('categoryId', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-category" className={!enabledFields.categoryId ? "text-muted-foreground" : ""}>Kategoria</Label>
                            <Select 
                                disabled={!enabledFields.categoryId} 
                                value={formData.categoryId || "none"} 
                                onValueChange={(v) => setFormData({...formData, categoryId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz kategorię" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Bez kategorii</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Brand */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-brand" 
                            checked={enabledFields.brandId} 
                            onCheckedChange={(c) => handleFieldToggle('brandId', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-brand" className={!enabledFields.brandId ? "text-muted-foreground" : ""}>Marka (Producent)</Label>
                            <Select 
                                disabled={!enabledFields.brandId} 
                                value={formData.brandId || "none"} 
                                onValueChange={(v) => setFormData({...formData, brandId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz markę" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Bez marki</SelectItem>
                                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Collection */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-collection" 
                            checked={enabledFields.collectionId} 
                            onCheckedChange={(c) => handleFieldToggle('collectionId', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-collection" className={!enabledFields.collectionId ? "text-muted-foreground" : ""}>Kolekcja</Label>
                            <Select 
                                disabled={!enabledFields.collectionId} 
                                value={formData.collectionId || "none"} 
                                onValueChange={(v) => setFormData({...formData, collectionId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz kolekcję" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Bez kolekcji</SelectItem>
                                    {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Supplier */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-supplier" 
                            checked={enabledFields.supplierId} 
                            onCheckedChange={(c) => handleFieldToggle('supplierId', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-supplier" className={!enabledFields.supplierId ? "text-muted-foreground" : ""}>Dostawca</Label>
                            <Select 
                                disabled={!enabledFields.supplierId} 
                                value={formData.supplierId || "none"} 
                                onValueChange={(v) => setFormData({...formData, supplierId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz dostawcę" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Bez dostawcy</SelectItem>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* Status */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-status" 
                            checked={enabledFields.status} 
                            onCheckedChange={(c) => handleFieldToggle('status', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-status" className={!enabledFields.status ? "text-muted-foreground" : ""}>Status</Label>
                            <Select 
                                disabled={!enabledFields.status} 
                                value={formData.status || "active"} 
                                onValueChange={(v) => setFormData({...formData, status: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktywny</SelectItem>
                                    <SelectItem value="draft">Szkic</SelectItem>
                                    <SelectItem value="archived">Zarchiwizowany</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mounting Method */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-mounting" 
                            checked={enabledFields.mountingMethod} 
                            onCheckedChange={(c) => handleFieldToggle('mountingMethod', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-mounting" className={!enabledFields.mountingMethod ? "text-muted-foreground" : ""}>Sposób Montażu</Label>
                            <Select 
                                disabled={!enabledFields.mountingMethod} 
                                value={formData.mountingMethodId || "none"} 
                                onValueChange={(v) => setFormData({...formData, mountingMethodId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Brak / Wyszczyść</SelectItem>
                                    {mountingMethods.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Pattern */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-pattern" 
                            checked={enabledFields.floorPattern} 
                            onCheckedChange={(c) => handleFieldToggle('floorPattern', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-pattern" className={!enabledFields.floorPattern ? "text-muted-foreground" : ""}>Wzór</Label>
                            <Select 
                                disabled={!enabledFields.floorPattern} 
                                value={formData.floorPatternId || "none"} 
                                onValueChange={(v) => setFormData({...formData, floorPatternId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="none">Brak / Wyszczyść</SelectItem>
                                    {floorPatterns.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Structure */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-structure" 
                            checked={enabledFields.structure} 
                            onCheckedChange={(c) => handleFieldToggle('structure', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-structure" className={!enabledFields.structure ? "text-muted-foreground" : ""}>Struktura</Label>
                            <Select 
                                disabled={!enabledFields.structure} 
                                value={formData.structureId || "none"} 
                                onValueChange={(v) => setFormData({...formData, structureId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="none">Brak / Wyszczyść</SelectItem>
                                    {structures.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Wear Class */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-wearClass" 
                            checked={enabledFields.wearClass} 
                            onCheckedChange={(c) => handleFieldToggle('wearClass', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-wearClass" className={!enabledFields.wearClass ? "text-muted-foreground" : ""}>Klasa</Label>
                            <Select 
                                disabled={!enabledFields.wearClass} 
                                value={formData.wearClassId || "none"} 
                                onValueChange={(v) => setFormData({...formData, wearClassId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Brak / Wyszczyść</SelectItem>
                                    {wearClasses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Wear Layer */}
                    <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-wearLayer" 
                            checked={enabledFields.wearLayerThickness} 
                            onCheckedChange={(c) => handleFieldToggle('wearLayerThickness', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-wearLayer" className={!enabledFields.wearLayerThickness ? "text-muted-foreground" : ""}>Warstwa (mm)</Label>
                            <Input 
                                disabled={!enabledFields.wearLayerThickness} 
                                value={formData.wearLayerThickness || ""} 
                                onChange={(e) => setFormData({...formData, wearLayerThickness: e.target.value})}
                                placeholder="0.55"
                                type="number"
                                step="0.05"
                            />
                        </div>
                    </div>

                    {/* Package Size */}
                     <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-packageSize" 
                            checked={enabledFields.packageSizeM2} 
                            onCheckedChange={(c) => handleFieldToggle('packageSizeM2', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-packageSize" className={!enabledFields.packageSizeM2 ? "text-muted-foreground" : ""}>Ilość w paczce (m²)</Label>
                            <Input 
                                disabled={!enabledFields.packageSizeM2} 
                                type="number" 
                                step="0.0001"
                                placeholder="0.0000"
                                value={formData.packageSizeM2 || ""} 
                                onChange={(e) => setFormData({...formData, packageSizeM2: e.target.value})}
                            />
                        </div>
                    </div>

                     {/* Price */}
                     <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
                        <Checkbox 
                            id="field-price" 
                            checked={enabledFields.price} 
                            onCheckedChange={(c) => handleFieldToggle('price', !!c)} 
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="field-price" className={!enabledFields.price ? "text-muted-foreground" : ""}>Cena sprzedaży (netto)</Label>
                            <Input 
                                disabled={!enabledFields.price} 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price || ""} 
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Attributes Section */}
                    <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center mb-4">
                            <Label className="text-base font-semibold">Atrybuty</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                                <Plus className="w-4 h-4 mr-2" /> Dodaj atrybut
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedAttributes.map((attrItem, index) => {
                                const selectedAttrDef = attributes.find(a => a.id === attrItem.attributeId);
                                const options = selectedAttrDef?.options || [];

                                return (
                                    <div key={index} className="flex gap-2 items-start">
                                        <Select 
                                            value={attrItem.attributeId} 
                                            onValueChange={(v) => updateAttribute(index, 'attributeId', v)}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Wybierz atrybut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {attributes.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select 
                                            value={attrItem.value} 
                                            onValueChange={(v) => updateAttribute(index, 'value', v)}
                                            disabled={!attrItem.attributeId}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Wybierz wartość" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeAttribute(index)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                            {selectedAttributes.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">Brak wybranych atrybutów do aktualizacji.</p>
                            )}
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zaktualizuj ({selectedIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
