'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThermometerSun, Box, Hammer, Info } from "lucide-react";

export function InvestorEssentialsCard() {
    return (
        <Card className="border-none shadow-md bg-indigo-50/50 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                    <Info className="w-5 h-5 text-indigo-600" />
                    Zanim przyjedzie montażysta
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm h-min text-indigo-600">
                        <Box className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Aklimatyzacja (48h)</h4>
                        <p className="text-xs text-gray-600 leading-snug mt-1">
                            Wnieś paczki do pomieszczenia min. 2 dni przed montażem. Niech &quot;odpoczną&quot; w temperaturze pokojowej.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                     <div className="bg-white p-2 rounded-lg shadow-sm h-min text-indigo-600">
                        <ThermometerSun className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Temperatura (18-22°C)</h4>
                        <p className="text-xs text-gray-600 leading-snug mt-1">
                            Utrzymuj stałą temperaturę w pomieszczeniu. Unikaj nagłych zmian i przeciągów.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                     <div className="bg-white p-2 rounded-lg shadow-sm h-min text-indigo-600">
                        <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                         <h4 className="font-semibold text-gray-900 text-sm">Pusta posadzka</h4>
                        <p className="text-xs text-gray-600 leading-snug mt-1">
                            Podłoże musi być czyste, suche i równe. Zabierz inne materiały budowlane z pola pracy.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
