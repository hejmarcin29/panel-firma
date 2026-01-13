"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ChevronLeft, ChevronRight, Check, Calendar, FileText, 
    Ruler, Hammer, Package, CheckCircle2, AlertCircle, Plus, Trash2, Camera, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuditForm } from "./technical/audit-form";
import { updateTechnicalAudit, uploadAuditPhotoAction } from "../technical-actions";
import type { TechnicalAuditData } from "../technical-data";
import type { MeasurementMaterialItem, FloorProductState } from "../types";

interface MeasurementAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    
    // State props
    measurementDate: string;
    setMeasurementDate: (val: string) => void;
    
    isHousingVat: boolean;
    setIsHousingVat: (val: boolean) => void;
    
    subfloorCondition: string;
    setSubfloorCondition: (val: string) => void;
    
    technicalAudit: TechnicalAuditData | null;
    montageId: string;
    
    installationMethod: 'click' | 'glue';
    setInstallationMethod: (val: 'click' | 'glue') => void;
    
    floorPattern: 'classic' | 'herringbone';
    setFloorPattern: (val: 'classic' | 'herringbone') => void;
    layingDirection: string;
    setLayingDirection: (val: string) => void;
    sketchPhotoUrl: string | null;
    setSketchPhotoUrl: (val: string | null) => void;
    panelWaste: string;
    setPanelWaste: (val: string) => void;
    
    floorArea: string;
    setFloorArea: (val: string) => void;
    
    panelModel: string;
    setIsPanelSelectorOpen: (val: boolean, index?: number) => void;

    // Floor Products (New Multi-Floor Support)
    floorProducts?: FloorProductState[];
    setFloorProducts?: (val: FloorProductState[]) => void;

    additionalMaterials: MeasurementMaterialItem[];
    setAdditionalMaterials: (val: MeasurementMaterialItem[]) => void;

    measurementRooms: { name: string; area: number }[];
    setMeasurementRooms: (val: { name: string; area: number }[]) => void;

    // Installation Date
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;

    initialStep?: number;
}

const STEPS = [
    { id: 'start', title: 'Termin', icon: Calendar },
    { id: 'tax', title: 'Podatki', icon: FileText },
    { id: 'subfloor', title: 'Podłoże', icon: Ruler },
    { id: 'floor_tech', title: 'Podłoga', icon: Package },
    { id: 'materials', title: 'Materiały', icon: Hammer },
    { id: 'installation', title: 'Realizacja', icon: Calendar },
    { id: 'finish', title: 'Podsumowanie', icon: CheckCircle2 },
];

export function MeasurementAssistantModal({
    isOpen, onClose, onSave,
    measurementDate, setMeasurementDate,
    isHousingVat, setIsHousingVat,
    subfloorCondition, setSubfloorCondition,
    technicalAudit, montageId,
    installationMethod, // setInstallationMethod unused
    floorPattern, // setFloorPattern unused
    // layingDirection unused
    // setLayingDirection unused
    sketchPhotoUrl, setSketchPhotoUrl,
    // panelWaste unused
    setPanelWaste,
    floorArea, setFloorArea,
    panelModel, setIsPanelSelectorOpen,
    floorProducts, setFloorProducts,
    additionalMaterials, setAdditionalMaterials,
    measurementRooms, // setMeasurementRooms unused
    dateRange, setDateRange,
    initialStep = 0
}: MeasurementAssistantModalProps) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [auditData, setAuditData] = useState<TechnicalAuditData | null>(technicalAudit);
    // const [isRoomsExpanded, setIsRoomsExpanded] = useState(measurementRooms.length > 0);
    const [isUploadingSketch, setIsUploadingSketch] = useState(false);

    // Auto-save Audit Data
    useEffect(() => {
        if (!auditData) return;
        
        const timer = setTimeout(async () => {
             console.log("Auto-saving technical audit...");
             try {
                 await updateTechnicalAudit(montageId, auditData);
             } catch (e) {
                 console.error("Audit auto-save failed", e);
             }
        }, 1500);

        return () => clearTimeout(timer);
    }, [auditData, montageId]);

    // Auto-calculate waste
    useEffect(() => {
        if (installationMethod === 'glue') {
            setPanelWaste('7');
        } else {
            // Click
            if (floorPattern === 'herringbone') {
                setPanelWaste('15');
            } else {
                setPanelWaste('7');
            }
        }
    }, [installationMethod, floorPattern, setPanelWaste]);

    // Update floor area when rooms change
    useEffect(() => {
        if (measurementRooms.length > 0) {
            const total = measurementRooms.reduce((sum, room) => sum + (room.area || 0), 0);
            setFloorArea(total.toFixed(2));
        }
    }, [measurementRooms, setFloorArea]);

    if (!isOpen) return null;

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Confirm action
            if (auditData) {
                await updateTechnicalAudit(montageId, auditData);
            }
            onSave();
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSaveDraft = async () => {
        if (auditData) {
            await updateTechnicalAudit(montageId, auditData);
        }
        onSave();
        onClose();
    };

    const isFormValid = () => {
        const isDateValid = !!measurementDate;
        const isFloorValid = !!floorArea && parseFloat(floorArea) > 0 && !!panelModel;
        const isInstallDateValid = !!dateRange?.from;
        return isDateValid && isFloorValid && isInstallDateValid;
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Start
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Rozpoczynamy Pomiar</h2>
                            <p className="text-muted-foreground">Potwierdź datę i godzinę wizyty.</p>
                        </div>
                        <div className="p-6 bg-muted/30 rounded-xl border space-y-4">
                            <Label className="text-lg">Data i godzina</Label>
                            <Input
                                type="datetime-local"
                                value={measurementDate}
                                onChange={(e) => setMeasurementDate(e.target.value)}
                                className="h-14 text-lg"
                            />
                            {!measurementDate && (
                                <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Wybierz termin, aby kontynuować.
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 1: // Tax
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Ustalenia Podatkowe</h2>
                            <p className="text-muted-foreground">Czy inwestycja kwalifikuje się na 8% VAT?</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setIsHousingVat(true)}
                                className={cn(
                                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                                    isHousingVat ? "border-primary bg-primary/5" : "border-muted bg-card"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold">TAK (8% VAT)</span>
                                    {isHousingVat && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Lokal mieszkalny do 150m² lub dom do 300m².
                                    Społeczny program mieszkaniowy.
                                </p>
                            </button>
                            <button
                                onClick={() => setIsHousingVat(false)}
                                className={cn(
                                    "p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                                    !isHousingVat ? "border-primary bg-primary/5" : "border-muted bg-card"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold">NIE (23% VAT)</span>
                                    {!isHousingVat && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Lokal użytkowy, firma, lub przekroczony metraż.
                                </p>
                            </button>
                        </div>
                    </div>
                );
            case 2: // Subfloor
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Audyt Podłoża</h2>
                            <p className="text-muted-foreground">Oceń stan wylewki i wilgotność.</p>
                        </div>
                        
                        <div className="space-y-4 p-4 border rounded-xl bg-card">
                            <Label>Ogólna ocena stanu</Label>
                            <Select value={subfloorCondition} onValueChange={setSubfloorCondition}>
                                <SelectTrigger className="h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50">
                                    <SelectItem value="ideal">Idealne (bez uwag)</SelectItem>
                                    <SelectItem value="good">Dobre (drobne nierówności)</SelectItem>
                                    <SelectItem value="bad">Złe (wymaga szlifowania/naprawy)</SelectItem>
                                    <SelectItem value="critical">Krytyczne (wymaga wylewki)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 border rounded-xl bg-card">
                            <AuditForm 
                                montageId={montageId} 
                                initialData={technicalAudit} 
                                readOnly={false}
                                hideSaveButton={true}
                                onChange={setAuditData}
                            />
                        </div>
                    </div>
                );
            case 3: // Floor & Tech (Merged)
                const updateFloorProduct = (index: number, changes: Partial<FloorProductState>) => {
                    if (!floorProducts || !setFloorProducts) return;
                    const newProducts = [...floorProducts];
                    newProducts[index] = { ...newProducts[index], ...changes };
                    setFloorProducts(newProducts);
                };

                const addFloorProduct = () => {
                     if (!setFloorProducts || !floorProducts) return;
                     setFloorProducts([...floorProducts, {
                        id: Math.random().toString(36).substring(7),
                        productId: null,
                         name: '',
                         area: 0,
                         waste: 5,
                         installationMethod: 'click',
                         pattern: 'simple',
                         layingDirection: '',
                         rooms: []
                     }]);
                };

                const removeFloorProduct = (index: number) => {
                     if (!setFloorProducts || !floorProducts) return;
                     const newProducts = floorProducts.filter((_, i) => i !== index);
                     setFloorProducts(newProducts);
                };

                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Modele Podłogi</h2>
                            <p className="text-muted-foreground">Dodaj wszystkie rodzaje podłóg w tym montażu.</p>
                        </div>

                        {/* Floor Products List */}
                        <div className="space-y-6">
                             {floorProducts && floorProducts.map((product, index) => (
                                 <div key={product.id} className="p-4 border rounded-xl bg-card space-y-4 relative">
                                     <div className="flex justify-between items-start">
                                         <Badge variant="secondary" className="mb-2">Model #{index + 1}</Badge>
                                         <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeFloorProduct(index)}>
                                             <Trash2 className="w-4 h-4" />
                                         </Button>
                                     </div>

                                     {/* Product Selection */}
                                     <div className="space-y-2">
                                        <Label>Model paneli</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={product.name}
                                                readOnly
                                                placeholder="Kliknij Wybierz..."
                                                className="h-12 font-medium"
                                                onClick={() => setIsPanelSelectorOpen(true, index)}
                                            />
                                            <Button 
                                                className="h-12 px-6" 
                                                onClick={() => setIsPanelSelectorOpen(true, index)}
                                            >
                                                Wybierz
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Area & Waste */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Metraż (m²)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={product.area || ''}
                                                    disabled={product.rooms.length > 0}
                                                    onChange={(e) => updateFloorProduct(index, { area: parseFloat(e.target.value) || 0 })}
                                                    className={cn(
                                                        "h-12 text-lg font-bold pr-8",
                                                        product.rooms.length > 0 && "bg-muted text-muted-foreground opacity-100"
                                                    )}
                                                />
                                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">m²</span>
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Zapas (%)</Label>
                                            <Select value={product.waste.toString()} onValueChange={(v) => updateFloorProduct(index, { waste: parseFloat(v) })}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-250">
                                                    {['0','5','7','10','12','15'].map(v => (
                                                        <SelectItem key={v} value={v}>{v}%</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Tech Details */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Wzór</Label>
                                            <Select value={product.pattern || 'simple'} onValueChange={(v) => updateFloorProduct(index, { pattern: v })}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-50">
                                                    <SelectItem value="simple">Klasycznie</SelectItem>
                                                    <SelectItem value="herringbone">Jodełka</SelectItem>
                                                    <SelectItem value="chevron">Chevron</SelectItem>
                                                    <SelectItem value="tiles">Płytki</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Montaż</Label>
                                            <Select value={product.installationMethod} onValueChange={(v: 'click'|'glue') => updateFloorProduct(index, { installationMethod: v })}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-50">
                                                    <SelectItem value="click">Click (Pływająca)</SelectItem>
                                                    <SelectItem value="glue">Klejona</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                         <Label>Kierunek</Label>
                                         <Input 
                                            value={product.layingDirection} 
                                            onChange={(e) => updateFloorProduct(index, { layingDirection: e.target.value })}
                                            placeholder="np. Od okna"
                                            className="h-12"
                                         />
                                     </div>

                                    {/* Rooms (Repeater) */}
                                     <div className="space-y-2 pt-2 border-t">
                                        <Label className="text-xs uppercase text-muted-foreground">Pomieszczenia (Dla tego modelu)</Label>
                                        {product.rooms.map((room, rIdx) => (
                                            <div key={rIdx} className="flex gap-2">
                                                <Input 
                                                    value={room.name} 
                                                    onChange={(e) => {
                                                        const newRooms = [...product.rooms];
                                                        newRooms[rIdx].name = e.target.value;
                                                        updateFloorProduct(index, { rooms: newRooms });
                                                    }}
                                                    placeholder="Nazwa"
                                                    className="flex-1 h-9 text-sm"
                                                />
                                                 <Input 
                                                    type="number"
                                                    value={room.area || ''} 
                                                    onChange={(e) => {
                                                        const newRooms = [...product.rooms];
                                                        newRooms[rIdx].area = parseFloat(e.target.value) || 0;
                                                        
                                                        // Calculate new total area for this product using only room sums if rooms exist
                                                        // OR we might want to let user override? Usually sum is safest.
                                                        const newTotalArea = newRooms.reduce((acc, curr) => acc + (curr.area || 0), 0);
                                                        
                                                        updateFloorProduct(index, { rooms: newRooms, area: newTotalArea });
                                                    }}
                                                    placeholder="m²"
                                                    className="w-20 h-9 text-sm"
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                     const newRooms = product.rooms.filter((_, i) => i !== rIdx);
                                                     // Recalculate area
                                                     const newTotalArea = newRooms.reduce((acc, curr) => acc + (curr.area || 0), 0);
                                                     updateFloorProduct(index, { rooms: newRooms, area: newTotalArea });
                                                }}>
                                                    <X className="w-3 h-3"/>
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed" onClick={() => {
                                            updateFloorProduct(index, { rooms: [...product.rooms, { name: '', area: 0 }] });
                                        }}>
                                            <Plus className="w-3 h-3 mr-1"/> Dodaj pomieszczenie
                                        </Button>
                                     </div>
                                 </div>
                             ))}

                             <Button onClick={addFloorProduct} className="w-full h-12 dashed border-2" variant="outline">
                                 <Plus className="w-5 h-5 mr-2" />
                                 Dodaj kolejny model podłogi
                             </Button>
                        </div>
                        
                        {/* Global Sketch */}
                         <div className="col-span-2 pt-2 pb-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            Szkic sytuacyjny (Opcjonalne)
                                        </Label>
                                        {sketchPhotoUrl && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-destructive hover:text-destructive"
                                                onClick={() => setSketchPhotoUrl(null)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Usuń
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {!sketchPhotoUrl ? (
                                        <div className="mt-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                id="sketch-upload"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    
                                                    setIsUploadingSketch(true);
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        formData.append('montageId', montageId);
                                                        const url = await uploadAuditPhotoAction(formData);
                                                        setSketchPhotoUrl(url);
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                    } finally {
                                                        setIsUploadingSketch(false);
                                                    }
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full h-16 border-dashed gap-2"
                                                disabled={isUploadingSketch}
                                                onClick={() => document.getElementById('sketch-upload')?.click()}
                                            >
                                                {isUploadingSketch ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                ) : (
                                                    <Camera className="w-5 h-5" />
                                                )}
                                                {isUploadingSketch ? "Wysyłanie..." : "Dodaj zdjęcie szkicu"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 relative rounded-xl overflow-hidden border bg-muted/20 h-48 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={sketchPhotoUrl} 
                                                alt="Szkic" 
                                                className="h-full w-auto max-w-full object-contain" 
                                            />
                                        </div>
                                    )}
                                </div>
                    </div>
                );
            case 4: // Materials
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Materiały Dodatkowe</h2>
                            <p className="text-muted-foreground">Co trzeba dokupić lub co zużyjesz?</p>
                        </div>

                        <div className="space-y-4">
                            {additionalMaterials.map((item, index) => (
                                <div key={item.id} className="p-4 border rounded-xl bg-card space-y-3 relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            const newItems = additionalMaterials.filter((_, i) => i !== index);
                                            setAdditionalMaterials(newItems);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="space-y-2">
                                        <Label>Nazwa produktu</Label>
                                        <Input 
                                            value={item.name}
                                            onChange={(e) => {
                                                const newItems = [...additionalMaterials];
                                                newItems[index].name = e.target.value;
                                                setAdditionalMaterials(newItems);
                                            }}
                                            placeholder="np. Klej montażowy, Listwy"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ilość</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...additionalMaterials];
                                                        newItems[index].quantity = e.target.value;
                                                        setAdditionalMaterials(newItems);
                                                    }}
                                                    placeholder="np. 2"
                                                    className="flex-1"
                                                />
                                                <Select
                                                    value={item.unit || 'opak.'}
                                                    onValueChange={(val) => {
                                                        const newItems = [...additionalMaterials];
                                                        newItems[index].unit = val;
                                                        setAdditionalMaterials(newItems);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-250">
                                                        <SelectItem value="szt">szt</SelectItem>
                                                        <SelectItem value="opak.">opak.</SelectItem>
                                                        <SelectItem value="mb">mb</SelectItem>
                                                        <SelectItem value="m2">m²</SelectItem>
                                                        <SelectItem value="kg">kg</SelectItem>
                                                        <SelectItem value="l">l</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Kto zapewnia?</Label>
                                            <Select
                                                value={item.supplySide}
                                                onValueChange={(val: 'installer' | 'company') => {
                                                    const newItems = [...additionalMaterials];
                                                    newItems[index].supplySide = val;
                                                    setAdditionalMaterials(newItems);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-250">
                                                    <SelectItem value="installer">Montażysta (Kupuję)</SelectItem>
                                                    <SelectItem value="company">Firma (Z magazynu)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Cost inputs removed for Stage 1 - moved to Cost Estimation Stage */}
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full py-6 border-dashed"
                                onClick={() => {
                                    setAdditionalMaterials([
                                        ...additionalMaterials,
                                        {
                                            id: crypto.randomUUID(),
                                            name: '',
                                            quantity: '',
                                            unit: 'opak.',
                                            supplySide: 'installer'
                                        }
                                    ]);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj pozycję
                            </Button>
                        </div>
                    </div>
                );
            case 5: // Installation Date
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Termin Realizacji</h2>
                            <p className="text-muted-foreground">Kiedy planujesz wykonać montaż?</p>
                        </div>

                        <div className="flex flex-col items-center space-y-4">
                            <div className="p-4 border rounded-xl bg-card">
                                <CalendarComponent
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                    locale={pl}
                                    className="rounded-md border"
                                />
                            </div>
                            
                            <div className="text-center p-4 bg-muted/30 rounded-xl w-full">
                                <Label className="text-muted-foreground mb-1 block">Wybrany termin:</Label>
                                <div className="text-lg font-medium">
                                    {dateRange?.from ? (
                                        <>
                                            {format(dateRange.from, "dd MMMM yyyy", { locale: pl })}
                                            {dateRange.to && (
                                                <> - {format(dateRange.to, "dd MMMM yyyy", { locale: pl })}</>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground italic">Nie wybrano daty</span>
                                    )}
                                </div>
                            </div>
                            
                            {!dateRange?.from && (
                                <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Wybierz termin w kalendarzu, aby kontynuować.
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 6: // Finish
                const isValid = isFormValid();
                return (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center mb-6">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center",
                                isValid ? "bg-green-100" : "bg-red-100"
                            )}>
                                {isValid ? (
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-12 h-12 text-red-600" />
                                )}
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold">{isValid ? "Gotowe!" : "Brakuje danych"}</h2>
                        <p className={cn(
                            "text-lg max-w-md mx-auto transition-colors",
                            isValid ? "text-muted-foreground" : "text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100"
                        )}>
                            {isValid 
                                ? "Wprowadziłeś wszystkie kluczowe dane." 
                                : "Uzupełnij brakujące informacje, aby zatwierdzić pomiar."}
                        </p>
                        
                        <div className="bg-muted/30 p-4 rounded-xl text-left space-y-2 mt-8">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Data pomiaru:</span>
                                {measurementDate ? (
                                    <span className="font-medium">{format(new Date(measurementDate), "dd.MM.yyyy HH:mm")}</span>
                                ) : (
                                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Brak
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Termin montażu:</span>
                                {dateRange?.from ? (
                                    <span className="font-medium">{format(dateRange.from, "dd.MM.yyyy")}</span>
                                ) : (
                                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Brak
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Metraż:</span>
                                {floorArea && parseFloat(floorArea) > 0 ? (
                                    <span className="font-medium">{floorArea} m²</span>
                                ) : (
                                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Brak
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Model panela:</span>
                                {panelModel ? (
                                    <span className="font-medium truncate max-w-[150px]">{panelModel}</span>
                                ) : (
                                    <span className="text-red-500 font-bold text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Brak
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">VAT:</span>
                                <span className="font-medium">{isHousingVat ? "8%" : "23%"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Materiały dod.:</span>
                                <span className="font-medium">{additionalMaterials.length} poz.</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-200 bg-background/95 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </Button>
                    <span className="font-semibold">Asystent Pomiaru</span>
                </div>
                <div className="text-sm text-muted-foreground">
                    Krok {currentStep + 1} z {STEPS.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-muted w-full">
                <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="max-w-lg mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="max-w-lg mx-auto flex gap-3">
                    {currentStep === STEPS.length - 1 ? (
                        <>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleBack}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Wstecz
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleSaveDraft}
                            >
                                Szkic
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[1.5] bg-green-600 hover:bg-green-700"
                                onClick={handleNext}
                                disabled={!isFormValid()}
                            >
                                Zatwierdź
                                <Check className="w-4 h-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Wstecz
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1"
                                onClick={handleNext}
                            >
                                Dalej
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
