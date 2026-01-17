'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, History } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { pl } from "date-fns/locale";

interface OrderCountdownProps {
    expectedDate: Date | null;
}

export function OrderCountdown({ expectedDate }: OrderCountdownProps) {
    if (!expectedDate) {
        return (
            <Card className="border-none shadow-md bg-white mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" />
                        Czas realizacji
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-gray-800">3-5 tygodni</p>
                    <p className="text-sm text-gray-500 mt-1">
                        To standardowy czas oczekiwania na ten produkt. Skontaktujemy się z Tobą telefonicznie, aby ustalić dokładny dzień dostawy.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const today = new Date();
    const target = new Date(expectedDate);
    const daysLeft = differenceInDays(target, today);
    const isPast = daysLeft < 0;

    return (
        <Card className="border-none shadow-md bg-white mb-6 overflow-hidden relative">
            {/* Background Accent */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isPast ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                         <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" />
                            Planowana Wysyłka
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {format(target, "d MMMM yyyy", { locale: pl })}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            {format(target, "EEEE", { locale: pl })}
                        </p>
                    </div>

                    {!isPast && (
                        <div className="text-right">
                            <span className="block text-4xl font-black text-blue-600">
                                {daysLeft}
                            </span>
                            <span className="text-xs uppercase font-bold text-blue-400">dni</span>
                        </div>
                    )}
                </div>

                {!isPast && (
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                         <div 
                            className="bg-blue-500 h-full rounded-full animate-pulse" 
                            style={{ width: '60%' }} // Placeholder animation
                         />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
