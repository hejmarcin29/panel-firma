"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ChevronLeft, ChevronRight, Check, DollarSign, 
    Hammer, CheckCircle2, Plus 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MeasurementMaterialItem } from "../types";

interface CostEstimationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (completed?: boolean) => void;
    
    // Data from Stage 1 (Read Only context)
    measurementDate?: string | null;
    additionalWorkDescription?: string | null;
    baseService?: { name: string; quantity: number; unit: string; price?: number };
    
    // Data to Edit (Stage 2)
    additionalMaterials: MeasurementMaterialItem[];
    setAdditionalMaterials: (val: MeasurementMaterialItem[]) => void;
    
    // Services (Simplified for now - just a list of added services)
    // In full implementation this would map to system services
    additionalServices: { id: string; name: string; quantity: number; unit: string; price: number }[];
    setAdditionalServices: (val: { id: string; name: string; quantity: number; unit: string; price: number }[]) => void;
}

const STEPS = [
    { id: 'materials', title: 'Ceny Materiałów', icon: DollarSign },
    { id: 'base_service', title: 'Usługa Bazowa', icon: Hammer },
    { id: 'services', title: 'Usługi Dodatkowe', icon: Plus },
    { id: 'finish', title: 'Podsumowanie', icon: CheckCircle2 },
];

export function CostEstimationModal({
    isOpen, onClose, onSave,
    additionalWorkDescription,
    baseService,
    additionalMaterials, setAdditionalMaterials,
    additionalServices, setAdditionalServices
}: CostEstimationModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onSave();
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Materials Pricing
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Wycena Materiałów</h2>
                            <p className="text-muted-foreground">
                                Uzupełnij ceny dla materiałów zadeklarowanych podczas pomiaru.
                            </p>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                            {additionalMaterials.length === 0 && (
                                <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-muted-foreground">Brak materiałów dodanych w pomiarze.</p>
                                </div>
                            )}

                            {additionalMaterials.map((item, index) => {
                                // Skip items without name (garbage data)
                                if (!item.name || item.name.trim() === '') {
                                    return null;
                                }

                                return (
                                <div key={item.id} className="p-4 border rounded-xl bg-card shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-lg">{item.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Ilość: {item.quantity} {item.unit || 'opak.'} • {item.supplySide === 'installer' ? 'Kupuje Montażysta' : 'Zapewnia Firma'}
                                            </p>
                                        </div>
                                    </div>

                                    {item.supplySide === 'installer' && (
                                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-blue-900 font-medium">Koszt zakupu</Label>
                                                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm">
                                                    <Label htmlFor={`est-gross-${item.id}`} className="text-xs cursor-pointer select-none font-medium">Kwota z paragonu (Brutto 23%)</Label>
                                                    <input 
                                                        type="checkbox" 
                                                        id={`est-gross-${item.id}`}
                                                        className="accent-blue-600 h-4 w-4"
                                                        onChange={(e) => {
                                                            const el = document.getElementById(`est-cost-input-${item.id}`) as HTMLInputElement;
                                                            if (el) {
                                                                el.dataset.isGross = e.target.checked ? 'true' : 'false';
                                                                if (item.estimatedCost) {
                                                                    if (e.target.checked) {
                                                                        el.value = (item.estimatedCost * 1.23).toFixed(2);
                                                                    } else {
                                                                        el.value = item.estimatedCost.toFixed(2);
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="relative">
                                                <Input
                                                    id={`est-cost-input-${item.id}`}
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    defaultValue={item.estimatedCost?.toFixed(2)}
                                                    onChange={(e) => {
                                                        const isGross = e.target.dataset.isGross === 'true';
                                                        const val = parseFloat(e.target.value);
                                                        
                                                        const newItems = [...additionalMaterials];
                                                        if (!isNaN(val)) {
                                                            newItems[index].estimatedCost = isGross ? val / 1.23 : val;
                                                        } else {
                                                            newItems[index].estimatedCost = undefined;
                                                        }
                                                        setAdditionalMaterials(newItems);
                                                    }}
                                                    className="pl-10 h-12 text-lg"
                                                />
                                                <span className="absolute left-3 top-3 text-muted-foreground">PLN</span>
                                                {item.estimatedCost && (
                                                    <div className="absolute right-3 top-3 text-sm font-medium text-green-600 bg-green-50 px-2 rounded">
                                                        {item.estimatedCost.toFixed(2)} netto
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 pt-1">
                                                <input 
                                                    type="checkbox"
                                                    id={`unknown-price-${item.id}`}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                    checked={item.estimatedCost === undefined}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const newItems = [...additionalMaterials];
                                                            newItems[index].estimatedCost = undefined;
                                                            setAdditionalMaterials(newItems);
                                                            // Clear input
                                                            const el = document.getElementById(`est-cost-input-${item.id}`) as HTMLInputElement;
                                                            if (el) el.value = '';
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`unknown-price-${item.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                                    Nie znam ceny / Wyceni Biuro
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 1: // Base Service
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Usługa Bazowa</h2>
                            <p className="text-muted-foreground">
                                Potwierdź wycenę usługi podstawowej wynikającej z pomiaru.
                            </p>
                        </div>

                        {baseService ? (
                            <div className="p-6 border rounded-xl bg-slate-50 border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Label className="text-slate-600">Nazwa Usługi</Label>
                                        <div className="font-medium text-xl">{baseService.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded">Automatyczna</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-1">
                                        <Label className="text-slate-600">Ilość</Label>
                                        <div className="font-medium text-lg">{baseService.quantity} {baseService.unit}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-slate-600">Cena jedn. (Netto)</Label>
                                        <div className="font-medium text-lg">
                                            {baseService.price ? `${baseService.price.toFixed(2)} PLN` : 'Brak stawki'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Wartość całkowita (Netto):</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {baseService.price ? (baseService.price * baseService.quantity).toFixed(2) : '0.00'} PLN
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Brak zdefiniowanej usługi bazowej.
                            </div>
                        )}
                    </div>
                );
            case 2: // Additional Services
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Usługi Dodatkowe</h2>
                            <p className="text-muted-foreground">
                                Dodaj usługi wynikające z pomiaru.
                            </p>
                        </div>

                        {additionalWorkDescription && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800 mb-4">
                                <span className="font-bold block mb-1">Notatka z pomiaru:</span>
                                &quot;{additionalWorkDescription}&quot;
                            </div>
                        )}

                        <div className="space-y-4">
                            {additionalServices.map((service, index) => (
                                <div key={service.id} className="p-4 border rounded-xl bg-card shadow-sm space-y-3 relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            const newServices = additionalServices.filter((_, i) => i !== index);
                                            setAdditionalServices(newServices);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>

                                    <div className="space-y-2">
                                        <Label>Nazwa Usługi</Label>
                                        <Input 
                                            value={service.name}
                                            onChange={(e) => {
                                                const newServices = [...additionalServices];
                                                newServices[index].name = e.target.value;
                                                setAdditionalServices(newServices);
                                            }}
                                            placeholder="np. Szlifowanie posadzki"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ilość</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="number"
                                                    value={service.quantity}
                                                    onChange={(e) => {
                                                        const newServices = [...additionalServices];
                                                        newServices[index].quantity = parseFloat(e.target.value) || 0;
                                                        setAdditionalServices(newServices);
                                                    }}
                                                />
                                                <Select
                                                    value={service.unit}
                                                    onValueChange={(val) => {
                                                        const newServices = [...additionalServices];
                                                        newServices[index].unit = val;
                                                        setAdditionalServices(newServices);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[80px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="m2">m²</SelectItem>
                                                        <SelectItem value="mb">mb</SelectItem>
                                                        <SelectItem value="szt">szt</SelectItem>
                                                        <SelectItem value="kpl">kpl</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cena jedn. (netto)</Label>
                                            <div className="relative">
                                                <Input 
                                                    type="number"
                                                    value={service.price}
                                                    onChange={(e) => {
                                                        const newServices = [...additionalServices];
                                                        newServices[index].price = parseFloat(e.target.value) || 0;
                                                        setAdditionalServices(newServices);
                                                    }}
                                                    className="pl-8"
                                                />
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">zł</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full py-6 border-dashed"
                                onClick={() => {
                                    setAdditionalServices([
                                        ...additionalServices,
                                        {
                                            id: crypto.randomUUID(),
                                            name: '',
                                            quantity: 1,
                                            unit: 'm2',
                                            price: 0
                                        }
                                    ]);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj usługę
                            </Button>
                        </div>
                    </div>
                );
            case 2: // Finish
                return (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold">Kosztorys Gotowy!</h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            Dane zostały uzupełnione. Biuro otrzyma informację o kosztach.
                        </p>
                        
                        <div className="bg-muted/30 p-4 rounded-xl text-left space-y-2 mt-8">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Materiały wycenione:</span>
                                <span className="font-medium">
                                    {additionalMaterials.filter(m => m.estimatedCost !== undefined).length} / {additionalMaterials.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dodane usługi:</span>
                                <span className="font-medium">{additionalServices.length}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-muted-foreground">Łączny szacunek (netto):</span>
                                <span className="font-bold text-lg">
                                    {(
                                        additionalMaterials.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0) +
                                        additionalServices.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
                                    ).toFixed(2)} PLN
                                </span>
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
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
                <div className="flex gap-1">
                    {STEPS.map((step, index) => (
                        <div 
                            key={step.id}
                            className={cn(
                                "h-2 w-8 rounded-full transition-colors",
                                index <= currentStep ? "bg-blue-600" : "bg-muted"
                            )}
                        />
                    ))}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
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
            <div className="p-4 border-t bg-background">
                <div className="max-w-lg mx-auto flex gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Wstecz
                    </Button>
                    
                    {currentStep === STEPS.length - 1 ? (
                        <div className="flex gap-2 flex-1">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 border-dashed"
                                onClick={() => {
                                    onSave(false); // Draft
                                    onClose();
                                }}
                            >
                                Zapisz roboczo
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                    onSave(true); // Submit
                                    onClose();
                                }}
                            >
                                Zatwierdź i Wyślij
                                <Check className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleNext}
                        >
                            Dalej
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
