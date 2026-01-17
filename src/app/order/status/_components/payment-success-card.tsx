'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, FileCheck } from "lucide-react";

interface PaymentSuccessCardProps {
    advanceDocUrl?: string | null;
    finalDocUrl?: string | null;
    statusLabel: string;
}

export function PaymentSuccessCard({ 
    advanceDocUrl, 
    finalDocUrl,
    statusLabel
}: PaymentSuccessCardProps) {

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm overflow-hidden mb-8">
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Płatność potwierdzona</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Dziękujemy! Twoja wpłata została zaksięgowana.<br/>
                                Aktualny status zamówienia: <span className="font-medium text-green-700">{statusLabel}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {(advanceDocUrl || finalDocUrl) && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        {advanceDocUrl && (
                            <Button 
                                className="bg-white text-green-700 border border-green-200 hover:bg-green-50 shadow-sm whitespace-nowrap" 
                                size="lg"
                                asChild
                            >
                                <a href={advanceDocUrl} target="_blank" rel="noopener noreferrer">
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    Pobierz Fakturę Zaliczkową
                                </a>
                            </Button>
                        )}
                        {finalDocUrl && (
                            <Button 
                                className="bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/10 whitespace-nowrap" 
                                size="lg"
                                asChild
                            >
                                <a href={finalDocUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Pobierz Fakturę Końcową
                                </a>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
