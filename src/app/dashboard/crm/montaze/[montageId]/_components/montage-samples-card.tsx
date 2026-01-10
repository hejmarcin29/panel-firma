"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link as LinkIcon, Package, ExternalLink, Loader2, CheckCircle2, Truck, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateMontageRealizationStatus, generateMontageToken } from "../../actions";
import { InPostLabelGenerator } from "./inpost-label-generator";
import type { Montage } from "../../types";
import { cn } from "@/lib/utils";
import { MontageSampleStatus } from "@/lib/db/schema";

interface MontageSamplesCardProps {
    montage: Montage;
    userRoles?: string[];
}

export function MontageSamplesCard({ montage, userRoles = [] }: MontageSamplesCardProps) {
    const router = useRouter();
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const handleSampleStatusChange = async (value: string) => {
        try {
            await updateMontageRealizationStatus({
                montageId: montage.id,
                sampleStatus: value as MontageSampleStatus
            });
            router.refresh();
            toast.success("Status próbek zaktualizowany");
        } catch (error) {
            console.error(error);
            toast.error("Błąd aktualizacji statusu");
        }
    };

    const handleCopyMagicLink = async () => {
        setIsGeneratingLink(true);
        try {
            const token = await generateMontageToken(montage.id);
            const url = `${window.location.origin}/montage/${token}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link skopiowany do schowka!", {
                description: "Wyślij go klientowi, aby wybrał próbki."
            });
        } catch (error) {
            console.error(error);
            toast.error("Nie udało się wygenerować linku");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'to_send': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
            case 'returned': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <Card className="h-fit">
            <CardHeader className="uppercase tracking-wider text-xs font-semibold text-muted-foreground pb-2">
                 <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Zestaw Próbek
                 </div>
            </CardHeader>
            <CardContent className="space-y-4">
                
                {/* Magic Link Section */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Wybór Próbek (Klient)</Label>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopyMagicLink} 
                            disabled={isGeneratingLink}
                            className="w-full justify-start"
                        >
                            {isGeneratingLink ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <LinkIcon className="h-4 w-4 mr-2 text-indigo-500" />
                            )}
                            {isGeneratingLink ? "Generowanie..." : "Kopiuj Magic Link"}
                        </Button>
                        {montage.accessToken && (
                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                <a href={`/montage/${montage.accessToken}`} target="_blank" rel="noopener noreferrer" title="Otwórz podgląd">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Order Details Section */}
                {montage.sampleDelivery ? (
                    <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-2">
                        <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Szczegóły Zamówienia
                        </div>
                        
                        {/* Products List (if available) */}
                        {montage.sampleDelivery.products && montage.sampleDelivery.products.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-sm mb-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {montage.sampleDelivery.products.map((p: any) => (
                                    <li key={p.id} className="truncate text-muted-foreground">{p.name}</li>
                                ))}
                            </ul>
                        )}

                        {/* Delivery Info */}
                        <div className="flex items-start gap-2 pt-2 border-t border-dashed border-gray-200 mt-2">
                            {montage.sampleDelivery.method === 'parcel_locker' ? (
                                <Box className="h-4 w-4 mt-0.5 text-yellow-600 shrink-0" />
                            ) : (
                                <Truck className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                            )}
                            <div className="grid gap-0.5 leading-tight">
                                <span className="font-medium">
                                    {montage.sampleDelivery.method === 'parcel_locker' ? 'Paczkomat' : 'Kurier'}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {montage.sampleDelivery.method === 'parcel_locker' 
                                        ? `${montage.sampleDelivery.pointName ?? ''} (${montage.sampleDelivery.pointAddress ?? ''})`
                                        : `${montage.sampleDelivery.address?.street ?? ''} ${montage.sampleDelivery.address?.buildingNumber ?? ''}, ${montage.sampleDelivery.address?.city ?? ''}`
                                    }
                                </span>
                                <span className="text-muted-foreground text-xs mt-1 block">
                                    {montage.sampleDelivery.recipient.name} ({montage.sampleDelivery.recipient.phone})
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-center p-2 text-muted-foreground italic border border-dashed rounded-md bg-slate-50">
                        Oczekiwanie na wybór próbek przez klienta...
                    </div>
                )}

                {/* Status Selection */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Status Przesyłki</Label>
                    <Select
                        value={montage.sampleStatus || "none"}
                        onValueChange={handleSampleStatusChange}
                    >
                        <SelectTrigger className={cn("w-full transition-colors", getStatusColor(montage.sampleStatus ?? null))}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak / Nie dotyczy</SelectItem>
                            <SelectItem value="to_send">❗ Do wysłania</SelectItem>
                            <SelectItem value="sent">✈️ Wysłano</SelectItem>
                            <SelectItem value="delivered">✅ Dostarczono</SelectItem>
                            <SelectItem value="returned">↩️ Zwrócono</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Logistics / Label Generator */}
                <div className="pt-2 border-t">
                     <InPostLabelGenerator 
                        montageId={montage.id}
                        sampleDelivery={montage.sampleDelivery}
                        sampleStatus={montage.sampleStatus ?? null}
                    />
                </div>

            </CardContent>
        </Card>
    );
}
