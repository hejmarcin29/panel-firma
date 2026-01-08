"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitSampleRequest } from "../actions";
import { CheckCircle2, Package, Truck, MapPin } from "lucide-react";

// Types needed for InPost GeoWidget
declare global {
  interface Window {
    easyPack: {
      modalMap: (
        callback: (point: any, modal: any) => void,
        options: {
          width?: number;
          height?: number;
          defaultLocale?: string;
        }
      ) => { open: () => void };
    };
  }
}

interface Product {
    id: string;
    name: string;
    sku: string;
    description: string | null;
}

interface SampleSelectorProps {
    token: string;
    samples: Product[];
}

type DeliveryMethod = 'courier' | 'parcel_locker';

export function SampleSelector({ token, samples }: SampleSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Delivery State
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
    const [selectedPoint, setSelectedPoint] = useState<{
        name: string;
        address: string;
    } | null>(null);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const openInPostModal = () => {
        if (typeof window.easyPack === 'undefined') {
            toast.error("Mapa InPost jeszcze się nie załadowała. Spróbuj za chwilę.");
            return;
        }

        const widget = window.easyPack.modalMap((point: any, modal: any) => {
            setSelectedPoint({
                name: point.name,
                address: `${point.address_details.street} ${point.address_details.building_number}, ${point.address_details.city}`
            });
            modal.closeModal(); // Close modal after selection
        }, {
            width: 500,
            height: 600,
            defaultLocale: 'pl'
        });
        widget.open();
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.error("Wybierz przynajmniej jedną próbkę.");
            return;
        }

        if (deliveryMethod === 'parcel_locker' && !selectedPoint) {
            toast.error("Proszę wybrać Paczkomat z mapy.");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitSampleRequest(token, selectedIds, {
                method: deliveryMethod,
                pointName: selectedPoint?.name,
                pointAddress: selectedPoint?.address
            });
            setIsSuccess(true);
            toast.success("Zamówienie złożone!");
        } catch (error) {
            console.error(error);
            toast.error("Wystąpił błąd. Spróbuj ponownie.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-bold text-green-900">Dziękujemy!</h2>
                <p className="text-lg text-muted-foreground max-w-md">
                    Twoje zamówienie na próbki zostało przyjęte. Poinformujemy Cię o wysyłce w osobnym powiadomieniu.
                </p>
                <div className="p-4 bg-muted rounded-lg mt-8">
                     <p className="text-sm font-medium">To okno możesz teraz zamknąć.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            <Script 
                src="https://geowidget.inpost.pl/inpost-geowidget.js" 
                strategy="lazyOnload"
                onLoad={() => {
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
                    document.head.appendChild(link);
                }}
            />

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Wybierz Próbki Podłóg</h1>
                <p className="text-muted-foreground">Zaznacz interesujące Cię produkty, a my wyślemy je do Ciebie bezpłatnie.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {samples.map(sample => (
                    <Card 
                        key={sample.id} 
                        className={`cursor-pointer transition-all border-2 hover:border-primary/50 relative overflow-hidden ${selectedIds.includes(sample.id) ? 'border-primary bg-primary/5' : 'border-transparent'}`}
                        onClick={() => toggleSelection(sample.id)}
                    >
                        {selectedIds.includes(sample.id) && (
                            <div className="absolute top-0 right-0 p-2 bg-primary text-primary-foreground rounded-bl-lg">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        )}
                        <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                            <div className="flex-1">
                                <CardTitle className="text-base line-clamp-2">{sample.name}</CardTitle>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{sample.sku}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground mb-4">
                                {/* Placeholder for image */}
                                <Package className="h-10 w-10 opacity-20" />
                            </div>
                            {sample.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {sample.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delivery Selection */}
            <div className="max-w-xl mx-auto space-y-6 pt-8 border-t">
                <h2 className="text-2xl font-bold text-center">Sposób Dostawy</h2>
                
                <RadioGroup 
                    defaultValue="courier" 
                    value={deliveryMethod} 
                    onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}
                    className="grid grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="courier" id="courier" className="peer sr-only" />
                        <Label
                            htmlFor="courier"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                        >
                            <Truck className="mb-3 h-6 w-6" />
                            <div className="text-center font-semibold">Kurier</div>
                            <div className="text-center text-xs text-muted-foreground mt-1">Na adres montażu</div>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="parcel_locker" id="parcel_locker" className="peer sr-only" />
                        <Label
                            htmlFor="parcel_locker"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                        >
                            <div className="mb-3 h-6 w-6 flex items-center justify-center font-bold text-yellow-500 bg-black rounded-sm px-1 text-[10px]">
                                InPost
                            </div>
                            <div className="text-center font-semibold">Paczkomat</div>
                            <div className="text-center text-xs text-muted-foreground mt-1">Odbiór 24/7</div>
                        </Label>
                    </div>
                </RadioGroup>

                {deliveryMethod === 'parcel_locker' && (
                     <div className="bg-muted/50 p-6 rounded-lg border-2 border-dashed border-primary/20 flex flex-col items-center gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                        {selectedPoint ? (
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-full mb-2">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-xl">{selectedPoint.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPoint.address}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={openInPostModal} className="mt-2">
                                    Zmień punkt
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold">Wybierz punkt odbioru</h3>
                                    <p className="text-sm text-muted-foreground">Kliknij przycisk poniżej, aby otworzyć mapę.</p>
                                </div>
                                <Button onClick={openInPostModal} className="w-full sm:w-auto" size="lg">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Otwórz mapę Paczkomatów
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="sticky bottom-4 mx-auto max-w-md z-50">
                <div className="bg-background/95 backdrop-blur-md border rounded-full p-2 shadow-2xl flex items-center justify-between pl-6 pr-2 ring-1 ring-border/50">
                    <div className="font-medium text-sm">
                        Wybrano: <span className="font-bold text-primary">{selectedIds.length}</span>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedIds.length === 0} size="lg" className="rounded-full shadow-md">
                        {isSubmitting ? "Wysyłanie..." : "Zamawiam (Bezpłatnie)"}
            </div>
        </div>
    );
}
