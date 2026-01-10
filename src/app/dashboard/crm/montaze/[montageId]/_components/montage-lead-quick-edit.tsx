"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateMontageLeadData } from "../../actions";
import { toast } from "sonner";

interface MontageLeadQuickEditProps {
    montageId: string;
    initialClientInfo: string | null;
    initialEstimatedArea: number | null | undefined;
    initialForecastedDate?: Date | null;
    initialInstallationMethod?: 'click' | 'glue' | null;
    initialFloorPattern?: 'classic' | 'herringbone' | null;
}

export function MontageLeadQuickEdit({ 
    montageId, 
    initialClientInfo, 
    initialEstimatedArea,
    initialForecastedDate,
    initialInstallationMethod,
    initialFloorPattern
}: MontageLeadQuickEditProps) {
    const [clientInfo, setClientInfo] = useState(initialClientInfo || "");
    const [estimatedArea, setEstimatedArea] = useState<string>(initialEstimatedArea?.toString() || "");
    const [forecastedDate, setForecastedDate] = useState<Date | undefined>(initialForecastedDate ? new Date(initialForecastedDate) : undefined);
    const [installationMethod, setInstallationMethod] = useState<'click' | 'glue' | null>(initialInstallationMethod || null);
    const [floorPattern, setFloorPattern] = useState<'classic' | 'herringbone' | null>(initialFloorPattern || null);
    
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const router = useRouter();
    
    const isMounted = useRef(false);
    
    const lastSaved = useRef({
        clientInfo: initialClientInfo || "",
        estimatedArea: initialEstimatedArea?.toString() || "",
        forecastedDate: initialForecastedDate ? new Date(initialForecastedDate).toISOString() : "",
        installationMethod: initialInstallationMethod || null,
        floorPattern: initialFloorPattern || null
    });

    const triggerSave = () => setStatus('saving');

    const handleClientInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setClientInfo(e.target.value);
        if (e.target.value !== lastSaved.current.clientInfo) triggerSave();
    };

    const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEstimatedArea(e.target.value);
        if (e.target.value !== lastSaved.current.estimatedArea) triggerSave();
    };
    
    const handleDateChange = (date: Date | undefined) => {
        setForecastedDate(date);
        const dateStr = date ? date.toISOString() : "";
        if (dateStr !== lastSaved.current.forecastedDate) triggerSave();
    };

    const handleMethodChange = (value: 'click' | 'glue') => {
        setInstallationMethod(value);
        if (value !== lastSaved.current.installationMethod) triggerSave();
    };

    const handlePatternChange = (value: 'classic' | 'herringbone') => {
        setFloorPattern(value);
        if (value !== lastSaved.current.floorPattern) triggerSave();
    };

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const currentForecastedDateStr = forecastedDate ? forecastedDate.toISOString() : "";

        if (
            clientInfo === lastSaved.current.clientInfo && 
            estimatedArea === lastSaved.current.estimatedArea &&
            currentForecastedDateStr === lastSaved.current.forecastedDate &&
            installationMethod === lastSaved.current.installationMethod &&
            floorPattern === lastSaved.current.floorPattern
        ) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                let areaParams: number | undefined = undefined; 
                if (estimatedArea) {
                    const parsed = parseFloat(estimatedArea.replace(',', '.'));
                    if (!isNaN(parsed)) {
                        areaParams = parsed;
                    }
                } 
                
                await updateMontageLeadData(montageId, {
                    clientInfo: clientInfo,
                    estimatedFloorArea: areaParams,
                    forecastedInstallationDate: forecastedDate || null,
                    measurementInstallationMethod: installationMethod,
                    measurementFloorPattern: floorPattern
                });

                lastSaved.current = { 
                    clientInfo, 
                    estimatedArea,
                    forecastedDate: currentForecastedDateStr,
                    installationMethod,
                    floorPattern
                };
                setStatus('saved');
                router.refresh();
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error(error);
                toast.error("Błąd zapisu danych");
                setStatus('idle');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [clientInfo, estimatedArea, forecastedDate, installationMethod, floorPattern, montageId, router]);

    return (
        <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Dane Wstępne (Lead)</h3>
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 flex items-center justify-center">
                        {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {status === 'saved' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="estimatedArea">Szacowana Powierzchnia</Label>
                    <div className="relative">
                        <Input 
                            id="estimatedArea"
                            value={estimatedArea}
                            onChange={handleAreaChange}
                            placeholder="0.00"
                            className="pr-8 font-mono text-lg"
                            type="number"
                            step="0.01"
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">m²</span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Planowany Termin</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !forecastedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {forecastedDate ? format(forecastedDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={forecastedDate}
                                onSelect={handleDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>System Montażu (Preferowany)</Label>
                    <Select 
                        value={installationMethod || undefined} 
                        onValueChange={(v) => handleMethodChange(v as 'click' | 'glue')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Wybierz..." />
                        </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="click">Pływający (Click)</SelectItem>
                            <SelectItem value="glue">Klejony</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Wzór (Preferowany)</Label>
                    <Select 
                        value={floorPattern || undefined} 
                        onValueChange={(v) => handlePatternChange(v as 'classic' | 'herringbone')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Wybierz..." />
                        </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="classic">Prosty / Klasyczny</SelectItem>
                            <SelectItem value="herringbone">Jodełka</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="clientInfo">Wymagania / Notatki</Label>
                <Textarea 
                    id="clientInfo"
                    value={clientInfo} 
                    onChange={handleClientInfoChange}
                    placeholder="Wpisz wymagania klienta, notatki z rozmowy..."
                    className="min-h-[150px] resize-y text-base"
                />
            </div>
        </div>
    );
}
