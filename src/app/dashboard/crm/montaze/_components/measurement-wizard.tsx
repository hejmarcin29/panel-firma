"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CalendarIcon, 
    Check, 
    ChevronRight, 
    ChevronLeft, 
    X, 
    Ruler, 
    FileText, 
    Hammer, 
    Package, 
    Save,
    Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { Montage, MeasurementMaterialItem } from "../types";
import type { TechnicalAuditData } from "../technical-data";
import { updateMontageMeasurement, finishMeasurementProtocol } from "../actions";
import { updateTechnicalAudit } from "../technical-actions";

interface MeasurementWizardProps {
    montage: Montage;
    onClose: () => void;
    onComplete: () => void;
}

const STEPS = [
    { id: 'basics', title: 'Termin i Podatki', icon: CalendarIcon },
    { id: 'technical', title: 'Warunki Techniczne', icon: Ruler },
    { id: 'floor', title: 'Podłoga', icon: Hammer },
    { id: 'materials', title: 'Materiały', icon: Package },
    { id: 'summary', title: 'Podsumowanie', icon: FileText },
];

export function MeasurementWizard({ montage, onClose, onComplete }: MeasurementWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // --- Form State ---
    // Basics
    const [measurementDate, setMeasurementDate] = useState(
        montage.measurementDate 
          ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
          : ""
    );
    const [isHousingVat, setIsHousingVat] = useState<boolean | null>(montage.isHousingVat ?? null);

    // Technical
    const [subfloorCondition, setSubfloorCondition] = useState(montage.measurementSubfloorCondition || 'good');
    
    const technicalAudit = montage.technicalAudit as TechnicalAuditData | undefined;
    const [auditData, setAuditData] = useState<TechnicalAuditData>({
        humidity: technicalAudit?.humidity ?? null,
        humidityMethod: technicalAudit?.humidityMethod ?? 'CM',
        flatness: technicalAudit?.flatness ?? null,
        subfloorType: technicalAudit?.subfloorType ?? null,
        heating: technicalAudit?.heating ?? false,
        heatingProtocol: technicalAudit?.heatingProtocol ?? false,
        floorHeated: technicalAudit?.floorHeated ?? false,
        notes: technicalAudit?.notes ?? '',
        photos: technicalAudit?.photos ?? [],
    });

    // Floor
    const [floorPattern, setFloorPattern] = useState<'classic' | 'herringbone'>(
        (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic'
    );
    const [installationMethod, setInstallationMethod] = useState<'click' | 'glue'>(
        (montage.measurementInstallationMethod as 'click' | 'glue') || 'click'
    );
    const [floorArea, setFloorArea] = useState<string>(montage.floorArea?.toString() || '');
    const [panelWaste, setPanelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
    const [panelModel, setPanelModel] = useState(montage.panelModel || '');

    // Materials
    const [additionalMaterials, setAdditionalMaterials] = useState<MeasurementMaterialItem[]>(() => {
        const raw = montage.measurementAdditionalMaterials as unknown;
        if (Array.isArray(raw)) return raw as MeasurementMaterialItem[];
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return [{ id: 'legacy-1', name: raw, quantity: '', supplySide: 'installer' }];
        }
        return [];
    });

    // --- Validation ---
    const canProceed = () => {
        switch (currentStep) {
            case 0: // Basics
                return !!measurementDate && isHousingVat !== null;
            case 1: // Technical
                return !!subfloorCondition; // Add more strict validation if needed
            case 2: // Floor
                return !!floorArea && parseFloat(floorArea) > 0;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            // 1. Save Measurement Data
            await updateMontageMeasurement({
                montageId: montage.id,
                measurementDetails: montage.measurementDetails || '', // Preserve
                floorArea: floorArea ? parseFloat(floorArea) : null,
                floorDetails: montage.floorDetails || '', // Preserve
                panelModel,
                panelWaste: parseFloat(panelWaste),
                modelsApproved: montage.modelsApproved || false,
                measurementDate,
                measurementInstallationMethod: installationMethod,
                measurementFloorPattern: floorPattern,
                measurementSubfloorCondition: subfloorCondition,
                measurementAdditionalMaterials: additionalMaterials,
                isHousingVat: isHousingVat === true,
                additionalInfo: montage.additionalInfo || '',
                sketchUrl: montage.sketchUrl,
                scheduledInstallationAt: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).getTime() : null,
                scheduledInstallationEndAt: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt).getTime() : null,
            });

            // 2. Save Technical Audit
            await updateTechnicalAudit(montage.id, auditData);

            // 3. Mark as Completed
            await finishMeasurementProtocol(montage.id);

            toast.success("Protokół został zatwierdzony!");
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error("Wystąpił błąd podczas zapisywania protokołu.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Steps ---
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Basics
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-lg">Data i godzina pomiaru</Label>
                            <Input
                                type="datetime-local"
                                value={measurementDate}
                                onChange={(e) => setMeasurementDate(e.target.value)}
                                className="h-12 text-lg"
                            />
                        </div>
                        
                        <div className="space-y-4 pt-4">
                            <Label className="text-lg">Ustalenia Podatkowe (VAT 8%)</Label>
                            <p className="text-sm text-muted-foreground">
                                Czy budynek spełnia wymogi społecznego programu mieszkaniowego?
                                (Lokal do 150m² lub dom do 300m²)
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsHousingVat(true)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                        isHousingVat === true 
                                            ? "border-green-500 bg-green-50 text-green-700" 
                                            : "border-muted hover:border-primary/50"
                                    )}
                                >
                                    <Check className={cn("w-6 h-6", isHousingVat === true ? "opacity-100" : "opacity-0")} />
                                    <span className="font-bold text-lg">TAK</span>
                                    <span className="text-xs text-muted-foreground">VAT 8%</span>
                                </button>
                                <button
                                    onClick={() => setIsHousingVat(false)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                        isHousingVat === false 
                                            ? "border-red-500 bg-red-50 text-red-700" 
                                            : "border-muted hover:border-primary/50"
                                    )}
                                >
                                    <X className={cn("w-6 h-6", isHousingVat === false ? "opacity-100" : "opacity-0")} />
                                    <span className="font-bold text-lg">NIE</span>
                                    <span className="text-xs text-muted-foreground">VAT 23%</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            
            case 1: // Technical
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Stan podłoża</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Wilgotność (%)</Label>
                                <Input 
                                    type="number" 
                                    step="0.1"
                                    value={auditData.humidity ?? ''}
                                    onChange={e => setAuditData({...auditData, humidity: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Metoda pomiaru</Label>
                                <Select 
                                    value={auditData.humidityMethod} 
                                    onValueChange={(v) => setAuditData({...auditData, humidityMethod: v as TechnicalAuditData['humidityMethod']})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CM">Metoda CM</SelectItem>
                                        <SelectItem value="electronic">Elektroniczna</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Równość podłoża</Label>
                            <Select 
                                value={auditData.flatness || ''} 
                                onValueChange={(v) => setAuditData({...auditData, flatness: v as TechnicalAuditData['flatness']})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ocena..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ok">W normie (gotowe)</SelectItem>
                                    <SelectItem value="grinding">Wymaga szlifowania</SelectItem>
                                    <SelectItem value="leveling">Wymaga wylewki</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>Ogrzewanie podłogowe</Label>
                                <p className="text-sm text-muted-foreground">Czy występuje w pomieszczeniach?</p>
                            </div>
                            <Switch 
                                checked={auditData.floorHeated}
                                onCheckedChange={v => setAuditData({...auditData, floorHeated: v})}
                            />
                        </div>
                    </div>
                );

            case 2: // Floor
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Wzór ułożenia</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setFloorPattern('classic');
                                        setPanelWaste('5');
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-center",
                                        floorPattern === 'classic' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <span className="font-semibold">Klasycznie</span>
                                    <div className="text-xs text-muted-foreground mt-1">Zapas 5%</div>
                                </button>
                                <button
                                    onClick={() => {
                                        setFloorPattern('herringbone');
                                        setPanelWaste('12');
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-center",
                                        floorPattern === 'herringbone' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <span className="font-semibold">Jodełka</span>
                                    <div className="text-xs text-muted-foreground mt-1">Zapas 12%</div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Metoda montażu</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setInstallationMethod('click')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-center",
                                        installationMethod === 'click' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <span className="font-semibold">Pływająca (Click)</span>
                                </button>
                                <button
                                    onClick={() => setInstallationMethod('glue')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-center",
                                        installationMethod === 'glue' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <span className="font-semibold">Klejona</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Powierzchnia netto (m²)</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={floorArea}
                                onChange={e => setFloorArea(e.target.value)}
                                className="h-12 text-lg"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Model paneli</Label>
                            <Input 
                                value={panelModel}
                                onChange={e => setPanelModel(e.target.value)}
                                placeholder="Wpisz nazwę lub wybierz z listy..."
                            />
                        </div>
                    </div>
                );

            case 3: // Materials
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label>Dodatkowe materiały</Label>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setAdditionalMaterials([...additionalMaterials, { id: crypto.randomUUID(), name: '', quantity: '', supplySide: 'installer' }])}
                            >
                                + Dodaj pozycję
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {additionalMaterials.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <div className="grid gap-2 flex-1">
                                        <Input 
                                            placeholder="Nazwa materiału" 
                                            value={item.name}
                                            onChange={e => {
                                                const newMaterials = [...additionalMaterials];
                                                newMaterials[index].name = e.target.value;
                                                setAdditionalMaterials(newMaterials);
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Ilość" 
                                                className="w-24"
                                                value={item.quantity}
                                                onChange={e => {
                                                    const newMaterials = [...additionalMaterials];
                                                    newMaterials[index].quantity = e.target.value;
                                                    setAdditionalMaterials(newMaterials);
                                                }}
                                            />
                                            <Select 
                                                value={item.supplySide}
                                                onValueChange={(v: 'installer' | 'company') => {
                                                    const newMaterials = [...additionalMaterials];
                                                    newMaterials[index].supplySide = v;
                                                    setAdditionalMaterials(newMaterials);
                                                }}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="installer">Po stronie montera</SelectItem>
                                                    <SelectItem value="company">Z magazynu firmy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => {
                                            const newMaterials = additionalMaterials.filter((_, i) => i !== index);
                                            setAdditionalMaterials(newMaterials);
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {additionalMaterials.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    Brak dodatkowych materiałów
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 4: // Summary
                return (
                    <div className="space-y-6">
                        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                Podsumowanie
                            </h3>
                            
                            <div className="grid gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Data pomiaru:</span>
                                    <span className="font-medium">{measurementDate.replace('T', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">VAT 8%:</span>
                                    <span className="font-medium">{isHousingVat ? 'TAK' : 'NIE'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Powierzchnia:</span>
                                    <span className="font-medium">{floorArea} m²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Wzór:</span>
                                    <span className="font-medium">{floorPattern === 'classic' ? 'Klasyczny' : 'Jodełka'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                            <p className="font-semibold mb-1">Uwaga!</p>
                            Po zatwierdzeniu protokołu, edycja będzie możliwa tylko przez administratora. Upewnij się, że wszystkie dane są poprawne.
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 bg-card">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                    <span className="font-semibold">Kreator Pomiaru</span>
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
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="max-w-lg mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {(() => {
                                const StepIcon = STEPS[currentStep].icon;
                                return StepIcon && <StepIcon className="w-6 h-6 text-primary" />;
                            })()}
                            {STEPS[currentStep].title}
                        </h2>
                    </div>
                    
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
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="max-w-lg mx-auto flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSaving}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Wstecz
                    </Button>
                    
                    {currentStep === STEPS.length - 1 ? (
                        <Button
                            className="h-12 bg-green-600 hover:bg-green-700"
                            style={{ flex: 2 }}
                            onClick={handleFinish}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Zatwierdź Protokół
                        </Button>
                    ) : (
                        <Button
                            className="h-12"
                            style={{ flex: 2 }}
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Dalej
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
