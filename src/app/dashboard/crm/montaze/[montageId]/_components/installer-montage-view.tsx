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
    Banknote,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateMontageStatus } from "../actions";

import { MontageNotesTab } from "./montage-notes-tab";
import { MontageGalleryTab } from "./montage-gallery-tab";
import { MontageTasksTab } from "./montage-tasks-tab";
import { MontageMeasurementTab } from "../../_components/montage-measurement-tab";
import { MontageSettlementTab } from "../../_components/montage-settlement-tab";
import { MontageClientCard } from "./montage-client-card"; // Reusing for edit capabilities if needed
import { MontageMaterialCard } from "./montage-material-card";
import { MeasurementScheduler } from "./measurement-scheduler";
import { JobCompletionWizard } from "../../_components/job-completion-wizard";
import type { Montage, MontageLog } from "../../types";
import type { UserRole } from "@/lib/db/schema";

interface InstallerMontageViewProps {
    montage: Montage;
    logs: MontageLog[];
    userRoles: UserRole[];
    hasGoogleCalendar?: boolean;
}

export function InstallerMontageView({ montage, logs, userRoles, hasGoogleCalendar = false }: InstallerMontageViewProps) {
    const [activeTab, setActiveTab] = useState("process");
    const [defaultOpenModal, setDefaultOpenModal] = useState<'assistant' | 'costEstimation' | undefined>(undefined);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

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

    // Determine the "Current Mission" based on status
    const isMeasurementStage = ['lead', 'before_measurement'].includes(montage.status);
    const isFormalitiesStage = ['before_first_payment'].includes(montage.status);
    const isInstallationStage = ['before_installation', 'before_final_invoice'].includes(montage.status);
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
                                {isMeasurementStage ? "Pomiar" : isInstallationStage ? "Montaż" : montage.status}
                            </Badge>
                        </div>

                        <div className="hidden md:block">
                             <Badge variant={isDone ? "default" : "outline"} className="text-sm px-3 py-1">
                                {isMeasurementStage ? "Pomiar" : isInstallationStage ? "Montaż" : montage.status}
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
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        {/* Status Selector Card */}
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">
                                    Status Zlecenia (Sterowanie Ręczne)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Select
                                        value={montage.status}
                                        onValueChange={async (val) => {
                                            toast.promise(updateMontageStatus(montage.id, val), {
                                                loading: 'Aktualizacja statusu...',
                                                success: 'Status zaktualizowany',
                                                error: 'Błąd aktualizacji statusu'
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-12 text-lg font-medium">
                                            <SelectValue placeholder="Wybierz status" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[400px]">
                                            <SelectGroup>
                                                <SelectLabel>1. Lejki</SelectLabel>
                                                <SelectItem value="new_lead">Nowe Zgłoszenie</SelectItem>
                                                <SelectItem value="contact_attempt">Próba Kontaktu</SelectItem>
                                                <SelectItem value="contact_established">Kontakt Nawiązany</SelectItem>
                                                <SelectItem value="measurement_scheduled">Pomiar Umówiony</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>2. Wycena</SelectLabel>
                                                <SelectItem value="measurement_done">Po Pomiarze</SelectItem>
                                                <SelectItem value="quote_in_progress">Wycena w Toku</SelectItem>
                                                <SelectItem value="quote_sent">Oferta Wysłana</SelectItem>
                                                <SelectItem value="quote_accepted">Oferta Zaakceptowana</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>3. Formalności</SelectLabel>
                                                <SelectItem value="contract_signed">Umowa Podpisana</SelectItem>
                                                <SelectItem value="waiting_for_deposit">Oczekiwanie na Zaliczkę</SelectItem>
                                                <SelectItem value="deposit_paid">Zaliczka Opłacona</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>4. Logistyka</SelectLabel>
                                                <SelectItem value="materials_ordered">Materiały Zamówione</SelectItem>
                                                <SelectItem value="materials_pickup_ready">Gotowe do Odbioru</SelectItem>
                                                <SelectItem value="installation_scheduled">Montaż Zaplanowany</SelectItem>
                                                <SelectItem value="materials_delivered">Materiały u Klienta</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>5. Realizacja</SelectLabel>
                                                <SelectItem value="installation_in_progress">Montaż w Toku</SelectItem>
                                                <SelectItem value="protocol_signed">Protokół Podpisany</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>6. Finisz</SelectLabel>
                                                <SelectItem value="final_invoice_issued">Faktura Końcowa</SelectItem>
                                                <SelectItem value="final_settlement">Rozliczenie Końcowe</SelectItem>
                                                <SelectItem value="completed">Zakończone</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>7. Specjalne</SelectLabel>
                                                <SelectItem value="on_hold">Wstrzymane</SelectItem>
                                                <SelectItem value="rejected">Odrzucone</SelectItem>
                                                <SelectItem value="complaint">Reklamacja</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Wybierz aktualny etap, aby zaktualizować oś czasu.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

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
