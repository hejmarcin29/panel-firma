"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ChevronLeft, ChevronRight, Check, Calendar, FileText, 
    Ruler, Hammer, Package, CheckCircle2, AlertCircle, Plus, Trash2, Search 
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuditForm } from "./technical/audit-form";
import type { TechnicalAuditData } from "../technical-data";
import type { MeasurementMaterialItem } from "../types";

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
    panelWaste: string;
    setPanelWaste: (val: string) => void;
    
    floorArea: string;
    setFloorArea: (val: string) => void;
    
    panelModel: string;
    setIsPanelSelectorOpen: (val: boolean) => void;

    additionalMaterials: MeasurementMaterialItem[];
    setAdditionalMaterials: (val: MeasurementMaterialItem[]) => void;
}

const STEPS = [
    { id: 'start', title: 'Termin', icon: Calendar },
    { id: 'tax', title: 'Podatki', icon: FileText },
    { id: 'subfloor', title: 'Podłoże', icon: Ruler },
    { id: 'floor_tech', title: 'Podłoga', icon: Package },
    { id: 'materials', title: 'Materiały', icon: Hammer },
    { id: 'finish', title: 'Podsumowanie', icon: CheckCircle2 },
];

export function MeasurementAssistantModal({
    isOpen, onClose, onSave,
    measurementDate, setMeasurementDate,
    isHousingVat, setIsHousingVat,
    subfloorCondition, setSubfloorCondition,
    technicalAudit, montageId,
    installationMethod, setInstallationMethod,
    floorPattern, setFloorPattern, panelWaste, setPanelWaste,
    floorArea, setFloorArea,
    panelModel, setIsPanelSelectorOpen,
    additionalMaterials, setAdditionalMaterials
}: MeasurementAssistantModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

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

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Confirm action
            onSave();
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSaveDraft = () => {
        onSave();
        onClose();
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
                                <SelectContent>
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
                            />
                        </div>
                    </div>
                );
            case 3: // Floor & Tech (Merged)
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Podłoga i Technologia</h2>
                            <p className="text-muted-foreground">Wybierz produkt i sposób montażu.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Product */}
                            <div className="space-y-2">
                                <Label>Model paneli</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={panelModel}
                                        readOnly
                                        placeholder="Kliknij Wybierz..."
                                        className="h-12"
                                        onClick={() => setIsPanelSelectorOpen(true)}
                                    />
                                    <Button 
                                        className="h-12 px-6" 
                                        onClick={() => setIsPanelSelectorOpen(true)}
                                    >
                                        Wybierz
                                    </Button>
                                </div>
                            </div>

                            {/* Tech */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Metoda</Label>
                                    <Select value={installationMethod} onValueChange={(v: 'click' | 'glue') => setInstallationMethod(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="click">Pływająca (Click)</SelectItem>
                                            <SelectItem value="glue">Klejona</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Wzór</Label>
                                    <Select value={floorPattern} onValueChange={(v: 'classic' | 'herringbone') => setFloorPattern(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="classic">Klasycznie</SelectItem>
                                            <SelectItem value="herringbone">Jodełka</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Area & Waste */}
                            <div className="p-4 bg-muted/30 rounded-xl space-y-4 border">
                                <div className="space-y-2">
                                    <Label>Wymiar z natury (Netto m²)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={floorArea}
                                        onChange={(e) => setFloorArea(e.target.value)}
                                        className="h-12 text-lg font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Zapas na ścinki (%)</Label>
                                    <div className="flex gap-2">
                                        {['5', '7', '10', '12', '15'].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setPanelWaste(val)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-md border text-sm font-medium transition-all",
                                                    panelWaste === val 
                                                        ? "bg-primary text-primary-foreground border-primary" 
                                                        : "bg-background hover:bg-muted"
                                                )}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Do zamówienia:</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {floorArea ? (parseFloat(floorArea) * (1 + parseInt(panelWaste)/100)).toFixed(2) : '0.00'} m²
                                    </span>
                                </div>
                            </div>
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
                                            <Input 
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newItems = [...additionalMaterials];
                                                    newItems[index].quantity = e.target.value;
                                                    setAdditionalMaterials(newItems);
                                                }}
                                                placeholder="np. 2 szt"
                                            />
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
                                                <SelectContent>
                                                    <SelectItem value="installer">Montażysta (Kupuję)</SelectItem>
                                                    <SelectItem value="company">Firma (Z magazynu)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
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
            case 5: // Finish
                return (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold">Gotowe!</h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            Wprowadziłeś wszystkie kluczowe dane.
                        </p>
                        
                        <div className="bg-muted/30 p-4 rounded-xl text-left space-y-2 mt-8">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Data:</span>
                                <span className="font-medium">{measurementDate ? format(new Date(measurementDate), "dd.MM.yyyy HH:mm") : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">VAT:</span>
                                <span className="font-medium">{isHousingVat ? "8%" : "23%"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Metraż:</span>
                                <span className="font-medium">{floorArea} m²</span>
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
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
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
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="max-w-lg mx-auto flex gap-4">
                    {currentStep === STEPS.length - 1 ? (
                        <>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleSaveDraft}
                            >
                                Zapisz jako szkic
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handleNext}
                            >
                                Zatwierdź i Wyślij
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
                                disabled={currentStep === 0 && !measurementDate}
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
