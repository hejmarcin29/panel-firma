'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar, ArrowRight, Navigation, Plus, CheckCircle2, AlertTriangle, Clock, History } from "lucide-react";
import Link from "next/link";
import { format, isToday } from "date-fns";
import { pl } from 'date-fns/locale';
import { JobCompletionWizard } from '../crm/montaze/_components/job-completion-wizard';

interface DashboardItem {
    id: string;
    clientName: string;
    status: string;
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
    floorArea?: number | null;
    // Relations
    clientSignatureUrl?: string | null;
    checklistItems?: { completed: boolean }[];
    notes?: { attachments?: { id: string }[] }[];
}

interface InstallerDashboardProps {
    overdue: DashboardItem[];
    today: DashboardItem[];
    upcoming: DashboardItem[];
    backlog: DashboardItem[];
    history: DashboardItem[];
}

export function InstallerDashboard({ overdue, today, upcoming, backlog, history }: InstallerDashboardProps) {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [selectedMontage, setSelectedMontage] = useState<DashboardItem | null>(null);

    const handleFinishClick = (item: DashboardItem) => {
        setSelectedMontage(item);
        setWizardOpen(true);
    };

    return (
        <div className="space-y-8 p-4 pb-32 max-w-md mx-auto md:max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Cześć!</h1>
                    <p className="text-muted-foreground">Twój plan pracy</p>
                </div>
                <Button size="icon" variant="outline" asChild>
                    <Link href="/dashboard/crm/montaze/nowy">
                        <Plus className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            {/* 1. OVERDUE (Zaległe) */}
            {overdue.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600 animate-pulse">
                        <AlertTriangle className="h-5 w-5" />
                        <h2 className="font-bold text-lg">Wymaga uwagi ({overdue.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {overdue.map((item) => (
                            <OverdueCard key={item.id} item={item} onFinish={() => handleFinishClick(item)} />
                        ))}
                    </div>
                </section>
            )}

            {/* 2. TODAY (Dziś) */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Dzisiejsze wizyty
                </h2>
                {today.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Calendar className="h-8 w-8 mb-2 opacity-50" />
                            <p>Brak zaplanowanych wizyt na dziś.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {today.map((item) => (
                            <TodayCard key={item.id} item={item} onFinish={() => handleFinishClick(item)} />
                        ))}
                    </div>
                )}
            </section>

            {/* 3. UPCOMING (Nadchodzące) */}
            {upcoming.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-5 w-5" />
                        Nadchodzące
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map((item) => (
                            <UpcomingCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* 4. BACKLOG (Poczekalnia) */}
            {backlog.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2 text-orange-600">
                        <Clock className="h-5 w-5" />
                        Poczekalnia / Do umówienia
                        <Badge variant="secondary" className="ml-2">{backlog.length}</Badge>
                    </h2>
                    <div className="space-y-3">
                        {backlog.map((item) => (
                            <BacklogCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* 5. HISTORY (Historia) */}
            {history.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2 text-muted-foreground">
                        <History className="h-5 w-5" />
                        Ostatnio zakończone
                    </h2>
                    <div className="space-y-2 opacity-75">
                        {history.map((item) => (
                            <HistoryCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* Wizard Modal */}
            {selectedMontage && (
                <JobCompletionWizard 
                    open={wizardOpen} 
                    onOpenChange={setWizardOpen} 
                    montage={{
                        ...selectedMontage,
                        checklistItems: selectedMontage.checklistItems?.map(i => ({ isChecked: i.completed }))
                    }} 
                />
            )}
        </div>
    );
}

// --- Subcomponents ---

function OverdueCard({ item, onFinish }: { item: DashboardItem, onFinish: () => void }) {
    return (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <Badge variant="destructive" className="mb-2">Zaległe</Badge>
                        <h3 className="font-bold text-lg">{item.clientName}</h3>
                        <p className="text-sm text-muted-foreground">
                            {item.installationCity || item.billingCity || 'Brak lokalizacji'}
                        </p>
                    </div>
                </div>
                <Button className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white" onClick={onFinish}>
                    Zakończ / Wyjaśnij
                </Button>
            </CardContent>
        </Card>
    );
}

function TodayCard({ item, onFinish }: { item: DashboardItem, onFinish: () => void }) {
    const address = item.installationAddress || item.address || 'Brak adresu';
    const city = item.installationCity || item.billingCity || '';
    const fullAddress = `${address}, ${city}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    const isMeasurement = !!item.measurementDate && isToday(new Date(item.measurementDate));
    const typeLabel = isMeasurement ? 'Pomiar' : 'Montaż';
    const typeColor = isMeasurement ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary shadow-md">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={typeColor}>{typeLabel}</Badge>
                            <h3 className="font-bold text-xl">{item.clientName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {fullAddress}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" className="w-full h-12" asChild>
                        <a href={`tel:${item.contactPhone}`}>
                            <Phone className="h-5 w-5 mr-2" /> Zadzwoń
                        </a>
                    </Button>
                    <Button className="w-full h-12" asChild>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-5 w-5 mr-2" /> Nawiguj
                        </a>
                    </Button>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                    <Button 
                        className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        onClick={onFinish}
                    >
                        <CheckCircle2 className="h-6 w-6 mr-2" />
                        Zakończ wizytę
                    </Button>
                </div>

                <div className="mt-3 text-center">
                    <Link href={`/dashboard/crm/montaze/${item.id}`} className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
                        Zobacz szczegóły zlecenia
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function UpcomingCard({ item }: { item: DashboardItem }) {
    const date = item.measurementDate ? new Date(item.measurementDate) : (item.scheduledInstallationAt ? new Date(item.scheduledInstallationAt) : new Date());
    const isMeasurement = !!item.measurementDate;
    
    return (
        <Card className="bg-muted/20">
            <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border shadow-sm">
                        <span className="text-xs font-bold text-red-500 uppercase">{format(date, 'MMM', { locale: pl })}</span>
                        <span className="text-lg font-bold text-foreground">{format(date, 'dd')}</span>
                    </div>
                    <div>
                        <h4 className="font-semibold">{item.clientName}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                {isMeasurement ? 'Pomiar' : 'Montaż'}
                            </Badge>
                            <span>{item.installationCity || item.billingCity}</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/crm/montaze/${item.id}`}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function BacklogCard({ item }: { item: DashboardItem }) {
    // Determine sub-status for display
    let statusLabel = "Do umówienia";
    let statusColor = "text-orange-600 bg-orange-50 border-orange-200";

    if (item.status === 'lead') {
        statusLabel = "Nowe zgłoszenie";
        statusColor = "text-blue-600 bg-blue-50 border-blue-200";
    } else if (item.status === 'before_measurement' && (item.floorArea || 0) > 0) {
        statusLabel = "Po pomiarze (Czeka na ofertę)";
        statusColor = "text-purple-600 bg-purple-50 border-purple-200";
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <Badge variant="outline" className={`mb-2 ${statusColor}`}>
                            {statusLabel}
                        </Badge>
                        <h3 className="font-semibold text-lg">{item.clientName}</h3>
                        <p className="text-sm text-muted-foreground">
                            {item.installationCity || item.billingCity || 'Brak lokalizacji'}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`tel:${item.contactPhone}`}>
                            <Phone className="h-4 w-4 mr-2" /> Zadzwoń
                        </a>
                    </Button>
                    <Button size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/crm/montaze/${item.id}`}>
                            <ArrowRight className="h-4 w-4 mr-2" /> Szczegóły
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function HistoryCard({ item }: { item: DashboardItem }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                    <h4 className="font-medium text-sm">{item.clientName}</h4>
                    <p className="text-xs text-muted-foreground">
                        Zakończono: {format(new Date(item.createdAt), 'dd.MM.yyyy')} {/* Using createdAt as proxy for now, ideally updatedAt or completedAt */}
                    </p>
                </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/crm/montaze/${item.id}`}>
                    Podgląd
                </Link>
            </Button>
        </div>
    );
}
