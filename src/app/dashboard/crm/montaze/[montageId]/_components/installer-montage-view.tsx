"use client";

import { useState } from "react";
import { 
    Phone, 
    MapPin, 
    Ruler, 
    Camera, 
    MessageSquare, 
    Navigation,
    Info,
    Calendar as CalendarIcon,
    CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { getStatusLabel } from "@/lib/montaze/statuses-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateMontageStatus, updateMontageMeasurementDate, updateMontageRealizationStatus } from "../../actions";
import { toast } from "sonner";
import { RequestDataButton } from "./request-data-button";

import { MontageNotesTab } from "./montage-notes-tab";
import { MontageGalleryTab } from "./montage-gallery-tab";
import { InstallerMeasurementTab } from "./installer-measurement-tab";
import { MontageSettlementTab } from "../../_components/montage-settlement-tab";
import { MontageClientCard } from "./montage-client-card";
import { StartWorkDialog } from "./start-work-dialog";
import { FinishWorkDialog } from "./finish-work-dialog";

// Controllers
import { MeasurementAssistantController } from "./measurement-assistant-controller";
import { CostEstimationController } from "./cost-estimation-controller";

import type { Montage, MontageLog } from "../../types";
import type { UserRole } from "@/lib/db/schema";
import { Separator } from "@/components/ui/separator";

interface InstallerMontageViewProps {
    montage: Montage;
    logs: MontageLog[];
    userRoles: UserRole[];
    hasGoogleCalendar?: boolean;
    withBottomNav?: boolean;
}

interface DashboardTileProps {
    icon: React.ReactNode;
    title: string;
    metric?: string;
    description?: string;
    onClick: () => void;
    alert?: boolean;
}

const DashboardTile = ({ icon, title, metric, description, onClick, alert }: DashboardTileProps) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-start p-4 bg-white rounded-xl border shadow-sm active:scale-95 transition-transform text-left w-full h-full relative overflow-hidden"
    >
        {alert && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full m-2 animate-pulse" />
        )}
        <div className="p-2 bg-muted/50 rounded-lg mb-3 text-primary">
            {icon}
        </div>
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {metric && <span className="text-xl font-bold text-gray-900 mt-1">{metric}</span>}
        {description && <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</span>}
    </button>
);

export function InstallerMontageView({ montage, logs, userRoles, withBottomNav = false }: InstallerMontageViewProps) {
    // Drawer States
    const [measurementOpen, setMeasurementOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [settlementOpen, setSettlementOpen] = useState(false);

    // Dialog States
    const [startWorkOpen, setStartWorkOpen] = useState(false);
    const [finishWorkOpen, setFinishWorkOpen] = useState(false);
    
    // Assistant Controllers
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [costEstimationOpen, setCostEstimationOpen] = useState(false);

    const address = montage.installationAddress || montage.billingAddress || 'Brak adresu';
    const city = montage.installationCity || montage.billingCity || '';
    const fullAddress = `${address}, ${city}`;
    const hasAddress = Boolean(
        (montage.installationAddress && montage.installationCity && montage.installationPostalCode) || 
        (montage.billingAddress && montage.billingCity && montage.billingPostalCode)
    );
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    // Helper: Primary Action Logic
    const renderPrimaryAction = () => {
        // 0. NEW FLOW: Confirm Assignment
        if (montage.installerStatus !== 'confirmed') {
            return (
                <div className="w-full flex flex-col gap-2">
                     <p className="text-xs text-center text-muted-foreground font-medium mb-1">
                        Potwierdź przyjęcie zlecenia, aby rozpocząć.
                    </p>
                    <Button 
                        size="lg" 
                        className="w-full h-12 text-base shadow-lg bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                        onClick={async () => {
                            toast.promise(async () => {
                                await updateMontageRealizationStatus({ 
                                    montageId: montage.id, 
                                    installerStatus: 'confirmed' 
                                });
                            }, {
                                loading: 'Potwierdzanie...',
                                success: 'Zlecenie przyjęte!',
                                error: 'Błąd'
                            });
                        }}
                    >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Potwierdzam Przyjęcie Zlecenia
                    </Button>
                </div>
            );
        }

        // 1. To Schedule
        if (montage.status === 'measurement_to_schedule') {
             return (
                <div className="w-full flex flex-col gap-2">
                    <p className="text-xs text-center text-muted-foreground font-medium mb-1">
                        Etap: Do Umówienia. Skontaktuj się z klientem.
                    </p>
                    <MeasurementDateSelector 
                         currentDate={montage.measurementDate ? new Date(montage.measurementDate) : null}
                         onSelect={async (date) => {
                             toast.promise(async () => {
                                 await updateMontageMeasurementDate(montage.id, date);
                                 await updateMontageStatus({ montageId: montage.id, status: 'measurement_scheduled' });
                             }, {
                                 loading: 'Zapisywanie...',
                                 success: 'Termin zapisany!',
                                 error: 'Błąd zapisu'
                             });
                         }}
                         fullWidth
                    />
                    {!hasAddress && <RequestDataButton montage={montage} ignoreSampleStatus={true} />}
                </div>
             )
        }
        
        // 2. Scheduled -> Start Measurement
        if (montage.status === 'measurement_scheduled') {
            return (
                <div className="w-full flex flex-col gap-2">
                    <Button 
                        size="lg" 
                        className="w-full h-12 text-base shadow-lg bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            setAssistantOpen(true);
                        }}
                    >
                        <Ruler className="mr-2 h-5 w-5" />
                        Uruchom Asystenta Pomiaru
                    </Button>
                    {!hasAddress && <RequestDataButton montage={montage} ignoreSampleStatus={true} />}
                </div>
            );
        }

        // 3. Measurement Done -> Cost Estimation (Primary)
        if (montage.status === 'measurement_done' || montage.status === 'quote_in_progress') {
             return (
                <div className="w-full flex flex-col gap-2">
                    <Button 
                        size="lg" 
                        className="w-full h-12 text-base shadow-lg bg-orange-600 hover:bg-orange-700"
                        onClick={() => {
                             setCostEstimationOpen(true);
                        }}
                    >
                        <span className="mr-2">💰</span>
                        Uzupełnij Kosztorys Robocizny
                    </Button>
                     <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => {
                             setMeasurementOpen(true);
                        }}
                    >
                        Pokaż szczegóły pomiaru
                    </Button>
                </div>
            );
        }

        // 4. Ready to Install -> Start Work
        if (['installation_scheduled', 'materials_delivered', 'materials_pickup_ready'].includes(montage.status)) {
             return (
                <Button 
                    size="lg" 
                    className="w-full h-12 text-base shadow-lg bg-green-600 hover:bg-green-700 animate-pulse"
                    onClick={() => setStartWorkOpen(true)}
                >
                    <Navigation className="mr-2 h-5 w-5" />
                    Rozpocznij Montaż
                </Button>
             );
        }

        // 5. In Progress -> Finish
        if (montage.status === 'installation_in_progress') {
             return (
                 <Button 
                    size="lg" 
                    className="w-full h-12 text-base shadow-lg bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setFinishWorkOpen(true)}
                >
                    <Badge className="mr-2 bg-white text-indigo-600 h-5 px-1.5">Finał</Badge>
                    Zakończ Pracę / Protokół
                </Button>
             );
        }

        // Default / Completed
        return (
            <Button 
                size="lg" 
                variant="secondary"
                className="w-full h-12 text-base cursor-not-allowed opacity-50"
                disabled
            >
                Brak wymaganych akcji
            </Button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-28 md:pb-24">
            
            {/* 1. STICKY HEADER */}
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm px-4 py-3 pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight pr-2">
                           {montage.clientName}
                        </h1>
                        <div className="flex items-center text-muted-foreground text-sm mt-0.5">
                            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span className="truncate max-w-[200px]">{city}, {address}</span>
                        </div>
                    </div>
                </div>
                
                {/* Quick Actions Row */}
                <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1 h-10 border-gray-200" asChild>
                        <a href={`tel:${montage.contactPhone}`}>
                            <Phone className="mr-2 h-4 w-4 text-green-600" />
                            Zadzwoń
                        </a>
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 border-gray-200" asChild>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="mr-2 h-4 w-4 text-blue-600" />
                            Nawiguj
                        </a>
                    </Button>
                </div>
            </header>

            {/* 2. HERO / STATUS SECTION (Condensed) */}
            <div className="px-4 py-3 bg-white border-b mb-3">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obecny Etap</span>
                    <Badge variant="secondary" className="font-normal">
                         {getStatusLabel(montage.status)}
                    </Badge>
                 </div>
                 
                 {/* Visual Confirmation Indicator */}
                 {montage.installerStatus === 'confirmed' && (
                     <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                         <CheckCircle className="w-3.5 h-3.5" />
                         <span className="text-xs font-medium">Zlecenie przyjęte i potwierdzone</span>
                     </div>
                 )}

                 {/* Dynamic Instruction */}
                 <p className="text-sm text-gray-600 leading-snug">
                    {montage.status === 'measurement_to_schedule' && "Skontaktuj się z klientem i ustal termin pomiaru."}
                    {montage.status === 'measurement_scheduled' && "Przygotuj się do wizyty. Pamiętaj o zabraniu dalmierza i wzorników."}
                    {montage.status === 'installation_in_progress' && "Wykonuj zdjęcia postępów co 2 godziny."}
                    {montage.status === 'completed' && "Zlecenie zakończone. Dziękujemy za dobrą robotę!"}
                    {!['measurement_to_schedule', 'measurement_scheduled', 'installation_in_progress', 'completed'].includes(montage.status) && "Sprawdź szczegóły poniżej."}
                 </p>
            </div>

            {/* 3. DASHBOARD TILES GRID */}
            <div className="grid grid-cols-2 gap-3 px-3">
                
                {/* Measurement Tile */}
                <DashboardTile 
                    icon={<Ruler className="w-6 h-6" />}
                    title="Dane Pomiaru"
                    metric={montage.floorArea ? "Wpisane" : "Brak"}
                    description={montage.floorArea ? `${montage.floorArea} m²` : "Kliknij, aby uzupełnić"}
                    onClick={() => setMeasurementOpen(true)}
                    alert={!montage.floorArea && ['measurement_scheduled', 'measurement_done'].includes(montage.status)}
                />

                {/* Gallery Tile */}
                <DashboardTile 
                    icon={<Camera className="w-6 h-6" />}
                    title="Zdjęcia"
                    metric={String(montage.attachments.length)}
                    description="Dokumentacja foto"
                    onClick={() => setGalleryOpen(true)}
                />

                {/* Notes Tile */}
                <DashboardTile 
                    icon={<MessageSquare className="w-6 h-6" />}
                    title="Notatki"
                    metric={String(montage.notes.length)}
                    description="Komentarze i ustalenia"
                    onClick={() => setNotesOpen(true)}
                    alert={false}
                />

                {/* Info / Contract Tile */}
                <DashboardTile 
                    icon={<Info className="w-6 h-6" />}
                    title="Szczegóły"
                    description="O ofercie i kliencie"
                    metric="Info"
                    onClick={() => setInfoOpen(true)}
                />

            </div>

            {/* 4. ADDITIONAL INFO */}
             {logs.length > 0 && (
                <div className="px-4 mt-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-1">Ostatnia Aktywność</h3>
                    <div className="bg-white rounded-xl border p-3 text-sm space-y-3 shadow-sm">
                         {logs.slice(0, 2).map(log => (
                             <div key={log.id} className="flex gap-3">
                                 <div className="w-1 h-1 bg-gray-300 rounded-full mt-2 shrink-0" />
                                 <div>
                                     <p className="text-gray-700 leading-snug">{log.details || log.action}</p>
                                     <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd.MM HH:mm", { locale: pl })}</span>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
             )}


            {/* 5. STICKY FOOTER ACTION BAR */}
            <div className={cn(
                "fixed left-0 right-0 bg-white border-t p-3 px-4 z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
                withBottomNav ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]" : "bottom-0"
            )}>
                {renderPrimaryAction()}
                
                {/* Secondary Actions (Link-like below the big button, optional) */}
                {['measurement_done', 'quote_in_progress'].includes(montage.status) && (
                     <button 
                        onClick={() => setSettlementOpen(true)}
                        className="w-full text-center text-xs text-muted-foreground font-medium mt-3 py-1"
                    >
                        Pokaż Kosztorys Robocizny
                    </button>
                )}
            </div>

            {/* --- DRAWERS AND DIALOGS --- */}
            
            {/* Measurement Drawer */}
            <Drawer open={measurementOpen} onOpenChange={setMeasurementOpen}>
                <DrawerContent className="h-[95vh] rounded-t-[20px]">
                    <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted my-4" />
                    <DrawerHeader className="text-left px-4 pt-0 pb-2">
                        <DrawerTitle>Dane Pomiarowe</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full px-4 pb-10">
                         <InstallerMeasurementTab 
                            montage={montage} 
                            userRoles={userRoles} 
                        />
                         <div className="h-20" /> {/* Spacer for scroll */}
                    </ScrollArea>>
                </DrawerContent>
            </Drawer>

            {/* Gallery Drawer */}
            <Drawer open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DrawerContent className="h-[95vh] rounded-t-[20px]">
                     <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted my-4" />
                     <DrawerHeader className="text-left px-4 pt-0 pb-2">
                        <DrawerTitle>Galeria Zdjęć</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full px-4 pb-10">
                        <MontageGalleryTab montage={montage} userRoles={userRoles} />
                        <div className="h-20" />
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

             {/* Notes Drawer */}
            <Drawer open={notesOpen} onOpenChange={setNotesOpen}>
                <DrawerContent className="h-[90vh] rounded-t-[20px]">
                     <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted my-4" />
                     <DrawerHeader className="text-left px-4 pt-0 pb-2">
                        <DrawerTitle>Notatki i Komentarze</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full px-4 pb-10">
                        <MontageNotesTab montage={montage} userRoles={userRoles} />
                        <div className="h-20" />
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

             {/* Info Drawer */}
            <Drawer open={infoOpen} onOpenChange={setInfoOpen}>
                <DrawerContent className="h-[90vh] rounded-t-[20px]">
                     <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted my-4" />
                     <DrawerHeader className="text-left px-4 pt-0 pb-2">
                        <DrawerTitle>Szczegóły Zlecenia</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full px-4 pb-10">
                        <MontageClientCard montage={montage} userRoles={userRoles} />
                        <div className="h-6" />
                        <Separator />
                        <div className="h-6" />
                        <h3 className="font-semibold mb-4">Finanse i Rozliczenia</h3>
                        <MontageSettlementTab montage={montage} userRoles={userRoles} />
                        <div className="h-20" />
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

             {/* Settlement Drawer (Short wrapper if opened directly) */}
            <Drawer open={settlementOpen} onOpenChange={setSettlementOpen}>
                <DrawerContent className="h-[85vh] rounded-t-[20px]">
                     <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted my-4" />
                     <DrawerHeader className="text-left px-4 pt-0 pb-2">
                        <DrawerTitle>Rozliczenia</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full px-4 pb-10">
                        <MontageSettlementTab montage={montage} userRoles={userRoles} />
                        <div className="h-20" />
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

            <StartWorkDialog 
                montageId={montage.id} 
                open={startWorkOpen} 
                onOpenChange={setStartWorkOpen} 
            />

            <FinishWorkDialog 
                montageId={montage.id} 
                open={finishWorkOpen} 
                onOpenChange={setFinishWorkOpen} 
            />

            {/* --- CONTROLLERS (LOGIC) --- */}
            <MeasurementAssistantController 
                montage={montage}
                isOpen={assistantOpen}
                onClose={() => setAssistantOpen(false)}
            />

            <CostEstimationController
                montage={montage}
                isOpen={costEstimationOpen}
                onClose={() => setCostEstimationOpen(false)}
            />

        </div>
    );
}

function MeasurementDateSelector({ 
    currentDate, 
    onSelect,
    fullWidth = false
}: { 
    currentDate: Date | null, 
    onSelect: (date: Date) => Promise<void>,
    fullWidth?: boolean
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
                    "justify-start text-left font-normal bg-white border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-primary h-12",
                    fullWidth && "w-full",
                    !currentDate && "text-muted-foreground"
                )}>
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {currentDate ? format(currentDate, "dd.MM.yyyy HH:mm", { locale: pl }) : <span className="font-semibold">Wybierz Datę Pomiaru</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
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
