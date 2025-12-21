'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle, ArrowRight } from "lucide-react";
import { LogisticsCard } from './logistics-card';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogisticsView({ initialMontages }: { initialMontages: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');

    // Detect conflicts: Quote updated AFTER logistics action
    const conflicts = initialMontages.filter(m => {
        const quote = m.quotes?.[0];
        if (!quote || !m.logisticsUpdatedAt) return false;
        
        const quoteUpdated = new Date(quote.updatedAt).getTime();
        const logisticsUpdated = new Date(m.logisticsUpdatedAt).getTime();
        
        // If quote is newer than last logistics action, and we have started packing (checklist not empty)
        const hasStartedPacking = m.cargoChecklist && Object.keys(m.cargoChecklist).length > 0;
        
        return hasStartedPacking && quoteUpdated > logisticsUpdated;
    });

    const filteredMontages = initialMontages.filter(m => {
        const searchLower = searchQuery.toLowerCase();
        return (
            m.clientName.toLowerCase().includes(searchLower) ||
            m.address?.toLowerCase().includes(searchLower) ||
            m.displayId?.toLowerCase().includes(searchLower)
        );
    });

    const installerPickup = filteredMontages.filter(m => m.materialClaimType === 'installer_pickup');
    const companyDelivery = filteredMontages.filter(m => m.materialClaimType === 'company_delivery');

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Logistyka Montaży</h1>
                    <p className="text-muted-foreground">Zarządzanie wydawaniem i transportem towarów.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj klienta, adresu..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {conflicts.length > 0 && (
                <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-900">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-semibold">Uwaga! Zmiany w wycenach</AlertTitle>
                    <AlertDescription className="mt-2">
                        <p className="mb-2 text-yellow-700">
                            Następujące montaże mają zaktualizowane wyceny po rozpoczęciu pakowania. Sprawdź listę towarów ponownie!
                        </p>
                        <ul className="space-y-1">
                            {conflicts.map(m => (
                                <li key={m.id} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{m.displayId}</span>
                                    <span>- {m.clientName}</span>
                                    <Link 
                                        href={`/dashboard/crm/montaze/${m.id}`} 
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-2"
                                    >
                                        Przejdź do montażu <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="all">Wszystkie</TabsTrigger>
                    <TabsTrigger value="installer_pickup">Odbiór Instalatora</TabsTrigger>
                    <TabsTrigger value="company_delivery">Dostawa Firmowa</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {filteredMontages.map(montage => (
                        <LogisticsCard key={montage.id} montage={montage} />
                    ))}
                    {filteredMontages.length === 0 && <EmptyState />}
                </TabsContent>
                
                <TabsContent value="installer_pickup" className="space-y-4 mt-4">
                    {installerPickup.map(montage => (
                        <LogisticsCard key={montage.id} montage={montage} />
                    ))}
                    {installerPickup.length === 0 && <EmptyState />}
                </TabsContent>

                <TabsContent value="company_delivery" className="space-y-4 mt-4">
                    {companyDelivery.map(montage => (
                        <LogisticsCard key={montage.id} montage={montage} />
                    ))}
                    {companyDelivery.length === 0 && <EmptyState />}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
            <p className="text-muted-foreground">Brak montaży w tym widoku.</p>
        </div>
    );
}
