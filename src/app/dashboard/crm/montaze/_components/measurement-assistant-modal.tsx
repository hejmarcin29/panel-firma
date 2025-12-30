"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, ChevronLeft, ChevronRight, Check, Calendar, FileText, 
    Ruler, Hammer, Package, CheckCircle2, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AuditForm } from "./technical/audit-form";
import type { TechnicalAuditData } from "../technical-data";

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
    setPanelWaste: (val: string) => void;
    
    floorArea: string;
    setFloorArea: (val: string) => void;
    
    panelModel: string;
    setIsPanelSelectorOpen: (val: boolean) => void;
}

const STEPS = [
    { id: 'start', title: 'Termin', icon: Calendar },
    { id: 'tax', title: 'Podatki', icon: FileText },
    { id: 'subfloor', title: 'Podłoże', icon: Ruler },
    { id: 'tech', title: 'Technologia', icon: Hammer },
    { id: 'floor', title: 'Podłoga', icon: Package },
    { id: 'finish', title: 'Podsumowanie', icon: CheckCircle2 },
];

export function MeasurementAssistantModal({
    isOpen, onClose, onSave,
    measurementDate, setMeasurementDate,
    isHousingVat, setIsHousingVat,
    subfloorCondition, setSubfloorCondition,
    technicalAudit, montageId,
    installationMethod, setInstallationMethod,
    floorPattern, setFloorPattern, setPanelWaste,
    floorArea, setFloorArea,
    panelModel, setIsPanelSelectorOpen,
}: MeasurementAssistantModalProps) {
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
                            />
                        </div>
                    </div>
                );
            case 3: // Tech
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Technologia</h2>
                            <p className="text-muted-foreground">Jak będziemy montować?</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-lg">Sposób montażu</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setInstallationMethod('click')}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            installationMethod === 'click' ? "border-primary bg-primary/5 font-bold" : "border-muted"
                                        )}
                                    >
                                        Pływająca (Click)
                                    </button>
                                    <button
                                        onClick={() => setInstallationMethod('glue')}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            installationMethod === 'glue' ? "border-primary bg-primary/5 font-bold" : "border-muted"
                                        )}
                                    >
                                        Klejona
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-lg">Wzór ułożenia</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setFloorPattern('classic');
                                            setPanelWaste('5');
                                        }}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            floorPattern === 'classic' ? "border-primary bg-primary/5 font-bold" : "border-muted"
                                        )}
                                    >
                                        Klasycznie
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFloorPattern('herringbone');
                                            setPanelWaste('12');
                                        }}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            floorPattern === 'herringbone' ? "border-primary bg-primary/5 font-bold" : "border-muted"
                                        )}
                                    >
                                        Jodełka
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4: // Floor
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Podłoga</h2>
                            <p className="text-muted-foreground">Wybierz model i wpisz metraż.</p>
                        </div>

                        <div className="space-y-4">
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

                            <div className="space-y-2">
                                <Label>Metraż netto (m²)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={floorArea}
                                    onChange={(e) => setFloorArea(e.target.value)}
                                    className="h-12 text-lg"
                                    placeholder="0.00"
                                />
                            </div>
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
                            Wprowadziłeś wszystkie kluczowe dane. Możesz teraz zatwierdzić protokół i wysłać go do biura.
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
                        className={cn("flex-1", currentStep === STEPS.length - 1 && "bg-green-600 hover:bg-green-700")}
                        onClick={handleNext}
                        disabled={currentStep === 0 && !measurementDate}
                    >
                        {currentStep === STEPS.length - 1 ? (
                            <>
                                Zatwierdź i Wyślij
                                <Check className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <>
                                Dalej
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
