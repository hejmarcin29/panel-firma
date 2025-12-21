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
    Navigation
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { MontageNotesTab } from "./montage-notes-tab";
import { MontageGalleryTab } from "./montage-gallery-tab";
import { MontageTasksTab } from "./montage-tasks-tab";
import { MontageMeasurementTab } from "../../_components/montage-measurement-tab";
import { MontageClientCard } from "./montage-client-card"; // Reusing for edit capabilities if needed
import { MontageMaterialCard } from "./montage-material-card";
import { MeasurementScheduler } from "./measurement-scheduler";
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
                        {/* Current Mission Card */}
                        <Card className="border-l-4 border-l-primary shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">
                                    Aktualny Cel
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isMeasurementStage && (
                                    <div className="space-y-4">
                                        <MeasurementScheduler 
                                            montageId={montage.id}
                                            currentDate={montage.measurementDate ? new Date(montage.measurementDate as string | number | Date) : null}
                                            clientPhone={montage.contactPhone}
                                            hasGoogleCalendar={hasGoogleCalendar}
                                        />
                                    </div>
                                )}

                                {isInstallationStage && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                                <CheckSquare className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Realizacja Montażu</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {montage.scheduledInstallationAt 
                                                        ? `Start: ${format(new Date(montage.scheduledInstallationAt), "dd.MM.yyyy", { locale: pl })}`
                                                        : "Czeka na termin"}
                                                </p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Twoje Zadania:</h4>
                                            <MontageTasksTab montage={montage} />
                                        <Separator />
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Materiały do zabrania:</h4>
                                            <MontageMaterialCard montage={montage} userRoles={userRoles} />
                                        </div>
                                        </div>
                                    </div>
                                )}

                                {isDone && (
                                    <div className="text-center py-4">
                                        <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full mb-3">
                                            <CheckSquare className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-lg">Zlecenie Zakończone</h3>
                                        <p className="text-sm text-muted-foreground">Dobra robota!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                        <MontageMeasurementTab montage={montage} userRoles={userRoles} />
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
