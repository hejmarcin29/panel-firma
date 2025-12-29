'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar, ArrowRight, Send, Navigation, Plus, Inbox, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format, isToday } from "date-fns";
import { toast } from "sonner";
import { sendDataRequest } from "../crm/montaze/actions";

interface DashboardItem {
    id: string;
    clientName: string;
    installationAddress?: string | null;
    address?: string | null;
    installationCity?: string | null;
    billingCity?: string | null;
    measurementDate?: Date | string | null;
    scheduledInstallationAt?: Date | string | null;
    forecastedInstallationDate?: Date | string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    createdAt: Date | string;
}

interface InstallerDashboardProps {
    leads: DashboardItem[];
    schedule: DashboardItem[];
    toSchedule?: DashboardItem[];
}

export function InstallerDashboard({ leads, schedule, toSchedule = [] }: InstallerDashboardProps) {
    return (
        <div className="space-y-6 p-4 pb-24 max-w-md mx-auto md:max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Cześć!</h1>
                    <p className="text-muted-foreground">Twój plan na dziś</p>
                </div>
                <Button size="icon" variant="outline" asChild>
                    <Link href="/dashboard/crm/montaze/nowy">
                        <Plus className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            {/* Today's Schedule */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Dzisiejsze wizyty
                </h2>
                {schedule.length === 0 ? (
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-8 w-8 mb-2 opacity-50" />
                            <p>Brak zaplanowanych wizyt na dziś.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {schedule.map((item) => (
                            <ScheduleCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>

            {/* To Schedule (New Section) */}
            {toSchedule.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2 text-orange-600">
                        <Phone className="h-5 w-5" />
                        Do umówienia
                        <Badge variant="destructive" className="ml-2">{toSchedule.length}</Badge>
                    </h2>
                    <div className="space-y-3">
                        {toSchedule.map((item) => (
                            <ToScheduleCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* Inbox / Leads */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-primary" />
                    Nowe zgłoszenia
                    {leads.length > 0 && <Badge variant="secondary" className="ml-2">{leads.length}</Badge>}
                </h2>
                {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-1">Brak nowych zgłoszeń.</p>
                ) : (
                    <div className="space-y-3">
                        {leads.map((item) => (
                            <LeadCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function ToScheduleCard({ item }: { item: DashboardItem }) {
    const forecastedDate = item.forecastedInstallationDate ? new Date(item.forecastedInstallationDate) : null;

    return (
        <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Czeka na termin
                            </Badge>
                            {forecastedDate && (
                                <Badge variant="secondary" className="text-xs text-muted-foreground bg-gray-100">
                                    📅 Plan: {format(forecastedDate, 'dd.MM.yyyy')}
                                </Badge>
                            )}
                            <h3 className="font-semibold text-lg">{item.clientName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {item.installationCity || item.billingCity || 'Brak lokalizacji'}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button variant="outline" className="w-full" asChild>
                        <a href={`tel:${item.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" /> Zadzwoń
                        </a>
                    </Button>
                    <Button className="w-full" asChild>
                        <Link href={`/dashboard/crm/montaze/${item.id}`}>
                            <Calendar className="h-4 w-4 mr-2" /> Ustal termin
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ScheduleCard({ item }: { item: DashboardItem }) {
    const address = item.installationAddress || item.address || 'Brak adresu';
    const city = item.installationCity || item.billingCity || '';
    const fullAddress = `${address}, ${city}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    const measurementDate = item.measurementDate ? new Date(item.measurementDate) : null;
    const installationDate = item.scheduledInstallationAt ? new Date(item.scheduledInstallationAt) : null;

    const isMeasurement = measurementDate && isToday(measurementDate);
    const isInstallation = installationDate && isToday(installationDate);

    const timeDisplay = isMeasurement && measurementDate 
        ? format(measurementDate, 'HH:mm') 
        : isInstallation && installationDate 
            ? format(installationDate, 'HH:mm') 
            : '??:??';

    const typeLabel = isMeasurement ? 'Pomiar' : isInstallation ? 'Montaż' : 'Wizyta';
    const typeColor = isMeasurement ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={typeColor}>{typeLabel}</Badge>
                            <h3 className="font-semibold text-lg">{item.clientName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {fullAddress}
                        </p>
                    </div>
                    <Badge variant="outline">
                        {timeDisplay}
                    </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button variant="outline" className="w-full" asChild>
                        <a href={`tel:${item.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" /> Zadzwoń
                        </a>
                    </Button>
                    <Button className="w-full" asChild>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-4 w-4 mr-2" /> Nawiguj
                        </a>
                    </Button>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-center">
                    <Link href={`/dashboard/crm/montaze/${item.id}`} className="text-sm font-medium text-primary flex items-center">
                        Szczegóły zlecenia <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function LeadCard({ item }: { item: DashboardItem }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSendRequest = async () => {
        if (!item.contactPhone && !item.contactEmail) {
            toast.error("Brak numeru telefonu i adresu email!");
            return;
        }
        
        setIsLoading(true);
        try {
            const result = await sendDataRequest(item.id);
            if (result.success) {
                toast.success("Wysłano prośbę o dane!");
                setIsSent(true);
            } else {
                toast.error("Błąd wysyłki");
            }
        } catch {
            toast.error("Wystąpił błąd");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{item.clientName}</h3>
                            <Badge variant="secondary" className="text-xs">Lead</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {item.installationCity || item.billingCity || 'Brak lokalizacji'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Zgłoszono: {format(new Date(item.createdAt), 'dd.MM.yyyy')}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <a href={`tel:${item.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" /> {item.contactPhone || 'Brak telefonu'}
                        </a>
                    </Button>
                    
                    {isSent ? (
                        <Button variant="secondary" size="sm" className="w-full justify-start text-green-600" disabled>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Wysłano prośbę
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            className="w-full justify-start" 
                            onClick={handleSendRequest}
                            disabled={isLoading || (!item.contactPhone && !item.contactEmail)}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Wyślij prośbę o dane
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
