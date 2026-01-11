"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerPortal } from "./customer-portal";
import { SampleSelector } from "./sample-selector";
import { Package, ClipboardList } from "lucide-react";

interface PortalViewProps {
    token: string;
    customer: any; // Type inferred from actions result
    samples: any[];
    geowidgetToken: string;
    geowidgetConfig: string;
    companyInfo: any;
    bankAccount?: string;
    initialTab?: string;
}

export function PortalView({
    token,
    customer,
    samples,
    geowidgetToken,
    geowidgetConfig,
    companyInfo,
    bankAccount,
    initialTab = "orders"
}: PortalViewProps) {
    const [activeTab, setActiveTab] = useState(initialTab);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    {companyInfo.logoUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={companyInfo.logoUrl} alt={companyInfo.name} className="h-10 w-auto" />
                    ) : (
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                            {companyInfo.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{companyInfo.name}</h1>
                        <p className="text-xs text-muted-foreground">Portal Klienta</p>
                    </div>
                </div>
                
                {/* User Info (Basic) */}
                <div className="text-right hidden md:block">
                    <p className="font-medium">Witaj, {customer.name || customer.email || "Gościu"}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex justify-center">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="samples" className="flex items-center gap-2">
                             <Package className="h-4 w-4" />
                             <span>Próbki</span>
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex items-center gap-2">
                             <ClipboardList className="h-4 w-4" />
                             <span>Moje Zlecenie</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="samples" className="animate-in fade-in duration-300">
                    <SampleSelector 
                        token={token}
                        samples={samples}
                        geowidgetToken={geowidgetToken}
                        geowidgetConfig={geowidgetConfig}
                    />
                </TabsContent>

                <TabsContent value="orders" className="animate-in fade-in duration-300">
                    <CustomerPortal 
                        customer={customer}
                        token={token}
                        bankAccount={bankAccount}
                        companyInfo={companyInfo}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
