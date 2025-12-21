'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LogisticsCard } from './logistics-card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogisticsView({ initialMontages }: { initialMontages: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');

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
