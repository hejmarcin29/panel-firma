'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ShopConfig } from "@/app/dashboard/settings/shop/actions";

interface PaymentDetailsCardProps {
    shopConfig: ShopConfig;
    orderReference: string;
    totalGross: number; // in grosz
    currency: string;
    proformaUrl?: string | null;
}

export function PaymentDetailsCard({ 
    shopConfig, 
    orderReference, 
    totalGross, 
    currency,
    proformaUrl 
}: PaymentDetailsCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`Skopiowano ${field}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency }).format(amount / 100);
    };

    // Helper for rendering copyable row
    const CopyableRow = ({ label, value, fieldId }: { label: string, value: string, fieldId: string }) => (
        <div 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-transparent hover:border-amber-200 hover:bg-amber-50/50 transition-all cursor-pointer"
            onClick={() => handleCopy(value, fieldId)}
        >
            <span className="text-sm text-gray-500 font-medium mb-1 sm:mb-0">{label}</span>
            <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-gray-900 text-lg break-all sm:break-normal">{value}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 shrink-0 transition-colors ${copiedField === fieldId ? 'text-green-600 bg-green-50' : 'text-gray-400 group-hover:text-amber-600'}`}
                >
                    {copiedField === fieldId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden mb-8">
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between mb-8">
                    <div className="flex items-start gap-4">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Oczekiwanie na wpłatę</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Twoje zamówienie jest już przyjęte!
                                <br/>
                                Prosimy o wykonanie przelewu, abyśmy mogli rozpocząć realizację.
                            </p>
                        </div>
                    </div>
                    
                    {proformaUrl && (
                        <Button 
                            className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 whitespace-nowrap" 
                            size="lg"
                            asChild
                        >
                            <a href={proformaUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Pobierz Proformę (PDF)
                            </a>
                        </Button>
                    )}
                </div>

                <Card className="border border-amber-200/60 shadow-none bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-2 md:p-4 space-y-1">
                        <CopyableRow 
                            label="Odbiorca" 
                            value={shopConfig.proformaBankRecipient || shopConfig.proformaBankName} 
                            fieldId="odbiorca" 
                        />
                         <CopyableRow 
                            label="Numer Konta" 
                            value={shopConfig.proformaBankAccount} 
                            fieldId="konto" 
                        />
                        <CopyableRow 
                            label="Tytuł przelewu" 
                            value={orderReference} 
                            fieldId="tytuł" 
                        />
                        <CopyableRow 
                            label="Kwota do zapłaty" 
                            value={formatCurrency(totalGross, currency)} 
                            fieldId="kwota" 
                        />
                    </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-center text-center">
                    <p className="text-sm text-gray-500 max-w-lg">
                        Po zaksięgowaniu wpłaty (zazwyczaj 1 dzień roboczy), Twój opiekun zamówienia skontaktuje się z Tobą telefonicznie, aby potwierdzić termin dostawy.
                    </p>
                </div>
            </div>
        </div>
    );
}
