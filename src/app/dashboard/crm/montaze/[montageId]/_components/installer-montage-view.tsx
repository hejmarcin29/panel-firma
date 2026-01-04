"use client";

import { useState } from "react";
import { 
    Phone, 
    MapPin, 
    Ruler, 
    Camera, 
    CheckSquare, 
    MessageSquare, 
    History, 
    FileText,
    Navigation,
    Banknote
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { updateMontageStatus, updateMontageMeasurementDate } from "../../actions";
import { toast } from "sonner";

import { MontageNotesTab } from "./montage-notes-tab";
import { MontageGalleryTab } from "./montage-gallery-tab";
import { MontageMeasurementTab } from "../../_components/montage-measurement-tab";
import { MontageSettlementTab } from "../../_components/montage-settlement-tab";
import { MontageClientCard } from "./montage-client-card"; // Reusing for edit capabilities if needed
import { MontageMaterialCard } from "./montage-material-card";
import { MontageProcessTimeline } from "./montage-process-timeline";
import type { Montage, MontageLog } from "../../types";
import type { UserRole } from "@/lib/db/schema";

interface InstallerMontageViewProps {
    montage: Montage;
    logs: MontageLog[];
    userRoles: UserRole[];
    hasGoogleCalendar?: boolean;
}

export function InstallerMontageView({ montage, logs, userRoles }: InstallerMontageViewProps) {
    const [activeTab, setActiveTab] = useState("process");
    const [defaultOpenModal, setDefaultOpenModal] = useState<'assistant' | 'costEstimation' | undefined>(undefined);

    // Filter logs to show only current user's actions (or system actions relevant to him)
    // In a real scenario, we'd filter by userId, but for now let's show all to keep context, 
    // or we can filter if we have the current user ID available. 
    // Let's assume we show all for context but simplified.
    const myLogs = logs; 

    // Filter attachments - hide sensitive docs
    // const safeAttachments = montage.attachments.filter(a => 
    //    !['contract', 'invoice', 'proforma'].includes(a.type)
    // );
    // const safeAttachments = montage.attachments;

    const address = montage.installationAddress || montage.billingAddress || 'Brak adresu';
    const city = montage.installationCity || montage.billingCity || '';
    const fullAddress = `${address}, ${city}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    const isDone = montage.status === 'completed';

    return (
        <div className="flex flex-col min-h-screen bg-muted/10 pb-20">
            {/* 1. HEADER (Mobile First, Desktop Responsive) */}
            <div className="bg-background border-b sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="p-4 space-y-3 md:flex md:items-center md:justify-between md:space-y-0 md:gap-6">
                        <div className="flex justify-between items-start md:block md:flex-1">
                            <div>
                                <h1 className="text-lg font-bold leading-tight md:text-xl">{montage.clientName}</h1>
                                <div className="flex items-center text-muted-foreground text-sm mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {city}, {address}
                                </div>
                            </div>
                            <Badge variant={isDone ? "default" : "outline"} className="md:hidden">
                                {montage.status}
                            </Badge>
                        </div>

                        <div className="hidden md:block">
                             <Badge variant={isDone ? "default" : "outline"} className="text-sm px-3 py-1">
                                {montage.status}
                            </Badge>
                        </div>

                        {/* BIG ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-3 md:flex md:w-auto">
                            <Button className="w-full h-12 text-base md:w-40" variant="outline" asChild>
                                <a href={`tel:${montage.contactPhone}`}>
                                    <Phone className="mr-2 h-5 w-5" />
                                    Zadzwoń
                                </a>
                            </Button>
                            <Button className="w-full h-12 text-base md:w-40" asChild>
                                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="mr-2 h-5 w-5" />
                                    Nawiguj
                                </a>
                            </Button>
                        </div>
                    </div>
                    
                    {/* TABS NAVIGATION */}
                    <div className="px-2 overflow-x-auto scrollbar-hide md:px-4">
                        <Tabs value={activeTab} onValueChange={(val) => {
                            setActiveTab(val);
                            setDefaultOpenModal(undefined);
                        }} className="w-full">
                            <TabsList className="w-full justify-start h-12 bg-transparent p-0 md:w-auto md:inline-flex">
                                <TabsTrigger value="process" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Proces
                                </TabsTrigger>
                                <TabsTrigger value="measurement" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <Ruler className="w-4 h-4 mr-2" />
                                    Pomiar
                                </TabsTrigger>
                                <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Notatki
                                </TabsTrigger>
                                <TabsTrigger value="gallery" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Zdjęcia
                                </TabsTrigger>
                                <TabsTrigger value="settlement" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <Banknote className="w-4 h-4 mr-2" />
                                    Rozliczenia
                                </TabsTrigger>
                                <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Info
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="p-4 space-y-6 max-w-4xl mx-auto w-full">
                
                {/* TAB: PROCESS (The Hub) */}
                {activeTab === 'process' && (
                    <div className="space-y-6">
                        {/* 1. Task-Driven Actions (Top Priority) */}
                        
                        {/* SCENARIO A: New Lead / Contact Attempt */}
                        {(montage.status === 'new_lead' || montage.status === 'contact_attempt') && (
                            <Card className="border-l-4 border-l-orange-500 shadow-md bg-orange-50/50">
                                <CardHeader>
                                    <CardTitle className="text-lg text-orange-900">Wymagane Akcje: Kontakt</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white border-orange-500 text-orange-700">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base">Skontaktuj się z Klientem</h4>
                                            <p className="text-sm text-muted-foreground">Zadzwoń, aby umówić termin pomiaru.</p>
                                        </div>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Button 
                                                variant="outline" 
                                                onClick={async () => {
                                                    toast.promise(updateMontageStatus({ montageId: montage.id, status: 'contact_attempt' }), {
                                                        loading: 'Zapisywanie...',
                                                        success: 'Zanotowano próbę kontaktu',
                                                        error: 'Błąd'
                                                    });
                                                }}
                                            >
                                                Nie odbiera
                                            </Button>
                                            <Button 
                                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                                onClick={async () => {
                                                    toast.promise(updateMontageStatus({ montageId: montage.id, status: 'contact_established' }), {
                                                        loading: 'Zapisywanie...',
                                                        success: 'Kontakt nawiązany!',
                                                        error: 'Błąd'
                                                    });
                                                }}
                                            >
                                                Kontakt Nawiązany
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* SCENARIO B: Contact Established -> Schedule Measurement */}
                        {montage.status === 'contact_established' && (
                            <Card className="border-l-4 border-l-blue-500 shadow-md bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="text-lg text-blue-900">Wymagane Akcje: Termin</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white border-blue-500 text-blue-700">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base">Umów Termin Pomiaru</h4>
                                            <p className="text-sm text-muted-foreground">Wybierz datę ustaloną z klientem.</p>
                                        </div>
                                        <MeasurementDateSelector 
                                            currentDate={montage.measurementDate ? new Date(montage.measurementDate) : null}
                                            onSelect={async (date) => {
                                                toast.promise(async () => {
                                                    await updateMontageMeasurementDate(montage.id, date);
                                                    await updateMontageStatus({ montageId: montage.id, status: 'measurement_scheduled' });
                                                }, {
                                                    loading: 'Zapisywanie terminu...',
                                                    success: 'Termin zapisany! Przechodzę do etapu pomiaru.',
                                                    error: 'Błąd zapisu'
                                                });
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* SCENARIO C: Measurement Scheduled (Existing) */}
                        {montage.status === 'measurement_scheduled' && (
                            <Card className="border-l-4 border-l-blue-500 shadow-md bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="text-lg text-blue-900">Wymagane Akcje: Pomiar</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Step 1: Measurement Assistant */}
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full border-2",
                                            (!!montage.measurementDate || !!montage.measurementDetails) 
                                                ? "bg-emerald-100 border-emerald-500 text-emerald-700" 
                                                : "bg-white border-blue-500 text-blue-700"
                                        )}>
                                            {(!!montage.measurementDate || !!montage.measurementDetails) ? <CheckSquare className="w-6 h-6" /> : <span className="font-bold">1</span>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base">Asystent Pomiaru</h4>
                                            <p className="text-sm text-muted-foreground">Wprowadź wymiary, wilgotność i zdjęcia.</p>
                                        </div>
                                        <Button 
                                            onClick={() => {
                                                setActiveTab('measurement');
                                                setDefaultOpenModal('assistant');
                                            }}
                                            variant={(!!montage.measurementDate || !!montage.measurementDetails) ? "outline" : "default"}
                                            className={cn(
                                                (!!montage.measurementDate || !!montage.measurementDetails) 
                                                    ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50" 
                                                    : "bg-blue-600 hover:bg-blue-700"
                                            )}
                                        >
                                            {(!!montage.measurementDate || !!montage.measurementDetails) ? "Edytuj / Podgląd" : "Uruchom"}
                                        </Button>
                                    </div>

                                    {/* Step 2: Labor Cost Estimate */}
                                    <div className={cn("flex items-center gap-4 transition-opacity", !(!!montage.measurementDate || !!montage.measurementDetails) && "opacity-50")}>
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full border-2",
                                            !!montage.costEstimationCompletedAt 
                                                ? "bg-emerald-100 border-emerald-500 text-emerald-700" 
                                                : "bg-white border-gray-300 text-gray-500"
                                        )}>
                                            {!!montage.costEstimationCompletedAt ? <CheckSquare className="w-6 h-6" /> : <span className="font-bold">2</span>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-base">Kosztorys Robocizny</h4>
                                            <p className="text-sm text-muted-foreground">Wyceń swoją pracę na podstawie pomiaru.</p>
                                        </div>
                                        <Button 
                                            onClick={() => setActiveTab('settlement')}
                                            disabled={!(!!montage.measurementDate || !!montage.measurementDetails)}
                                            variant={!!montage.costEstimationCompletedAt ? "outline" : "secondary"}
                                            className={cn(
                                                !!montage.costEstimationCompletedAt 
                                                    ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50" 
                                                    : ""
                                            )}
                                        >
                                            {!!montage.costEstimationCompletedAt ? "Edytuj / Podgląd" : "Wypełnij"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. Read-Only Timeline */}
                        <MontageProcessTimeline montage={montage} readOnly={true} />

                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Materiały do zabrania:</h4>
                            <MontageMaterialCard montage={montage} userRoles={userRoles} />
                        </div>

                        {/* Recent History (Simplified) */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground px-1">Ostatnia aktywność</h3>
                            <div className="bg-card rounded-lg border divide-y">
                                {myLogs.slice(0, 3).map((log) => (
                                    <div key={log.id} className="p-3 text-sm flex gap-3">
                                        <History className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <div>
                                            <p>{log.details || log.action}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(log.createdAt), "dd.MM HH:mm", { locale: pl })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {myLogs.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Brak historii</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: MEASUREMENT (Form) */}
                {activeTab === 'measurement' && (
                    <div className="space-y-4">
                        <MontageMeasurementTab 
                            montage={montage} 
                            userRoles={userRoles} 
                            defaultOpenModal={defaultOpenModal}
                        />
                    </div>
                )}

                {/* TAB: NOTES */}
                {activeTab === 'notes' && (
                    <MontageNotesTab montage={montage} userRoles={userRoles} />
                )}

                {/* TAB: GALLERY */}
                {activeTab === 'gallery' && (
                    <MontageGalleryTab 
                        montage={montage} 
                        userRoles={userRoles} 
                    />
                )}

                {/* TAB: SETTLEMENT */}
                {activeTab === 'settlement' && (
                    <MontageSettlementTab montage={montage} userRoles={userRoles} />
                )}

                {/* TAB: INFO (Client Details) */}
                {activeTab === 'info' && (
                    <MontageClientCard 
                        montage={montage} 
                        userRoles={userRoles}
                        // Hide complex edit options for installer if needed, 
                        // but keeping them for now so he can update dates
                    />
                )}
            </div>
        </div>
    );
}

function MeasurementDateSelector({ 
    currentDate, 
    onSelect 
}: { 
    currentDate: Date | null, 
    onSelect: (date: Date) => Promise<void> 
}) {
    const [date, setDate] = useState<Date | undefined>(currentDate || undefined);
    const [time, setTime] = useState(currentDate ? format(currentDate, "HH:mm") : "09:00");
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleConfirm = async () => {
        if (!date) return;
        
        setIsSaving(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const finalDate = new Date(date);
            finalDate.setHours(hours, minutes);
            
            await onSelect(finalDate);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Błąd zapisu daty");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !currentDate && "text-muted-foreground"
                )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDate ? format(currentDate, "dd.MM.yyyy HH:mm", { locale: pl }) : <span>Wybierz datę</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b space-y-3">
                        <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Godzina:</Label>
                        <Input 
                            type="time" 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                            className="w-32 font-mono"
                        />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                        {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(t => (
                            <Button
                                key={t}
                                variant={time === t ? "default" : "outline"}
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setTime(t)}
                            >
                                {t}
                            </Button>
                        ))}
                        </div>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={pl}
                />
                <div className="p-3 border-t">
                    <Button 
                        className="w-full" 
                        disabled={!date || isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? "Zapisywanie..." : "Zatwierdź termin"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
