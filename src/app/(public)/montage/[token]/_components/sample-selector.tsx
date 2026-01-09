"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitSampleRequest } from "../actions";
import { CheckCircle2, Package, Truck, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

interface Product {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    imageUrl: string | null;
}

interface SampleSelectorProps {
    token: string;
    samples: Product[];
    geowidgetToken: string;
    geowidgetConfig: string;
}

type DeliveryMethod = 'courier' | 'parcel_locker';

export function SampleSelector({ token, samples, geowidgetToken, geowidgetConfig }: SampleSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Delivery State
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
    const [selectedPoint, setSelectedPoint] = useState<{
        name: string;
        address: string;
    } | null>(null);

    // Form State
    const [recipient, setRecipient] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [address, setAddress] = useState({
        street: '',
        buildingNumber: '',
        city: '',
        postalCode: ''
    });

    const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
    const [hasMapError, setHasMapError] = useState(false);
    const [isGeoDialogOpen, setIsGeoDialogOpen] = useState(false);

    const onPointEventName = useMemo(() => "inpost_point_selected", []);
    const geoWidgetRef = useRef<HTMLElement | null>(null);

    const initMap = () => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
        if (!document.head.querySelector(`link[href="${link.href}"]`)) {
            document.head.appendChild(link);
        }
        setIsMapScriptLoaded(true);
    };

    useEffect(() => {
        if (!isGeoDialogOpen) return;

        // IMPORTANT: Geowidget v5 defines some properties (like `token`) as getter-only.
        // React may try to set them as DOM properties and crash. We set them as attributes manually.
        if (geoWidgetRef.current) {
            geoWidgetRef.current.setAttribute("token", geowidgetToken || "");
            geoWidgetRef.current.setAttribute("config", geowidgetConfig || "");
            geoWidgetRef.current.setAttribute("language", "pl");
            geoWidgetRef.current.setAttribute("onpoint", onPointEventName);
        }

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            const detail = customEvent?.detail as unknown;
            if (!detail || typeof detail !== "object") return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point = detail as any;

            const name =
                point?.name ??
                point?.id ??
                point?.pointName ??
                point?.point_id ??
                "";

            const street =
                point?.address_details?.street ??
                point?.address?.street ??
                point?.street ??
                "";

            const buildingNumber =
                point?.address_details?.building_number ??
                point?.address?.buildingNumber ??
                point?.building_number ??
                point?.buildingNumber ??
                "";

            const city =
                point?.address_details?.city ??
                point?.address?.city ??
                point?.city ??
                "";

            const postalCode =
                point?.address_details?.post_code ??
                point?.address?.postCode ??
                point?.post_code ??
                point?.postalCode ??
                "";

            const addressLine1 =
                point?.address?.line1 ??
                point?.address?.line_1 ??
                "";

            const addressLine2 =
                point?.address?.line2 ??
                point?.address?.line_2 ??
                "";

            const composedAddress = [
                [street, buildingNumber].filter(Boolean).join(" "),
                [postalCode, city].filter(Boolean).join(" "),
            ]
                .filter(Boolean)
                .join(", ");

            const address =
                [addressLine1, addressLine2].filter(Boolean).join(", ") ||
                composedAddress ||
                "";

            if (!name) {
                toast.error("Nie udało się odczytać wybranego punktu. Spróbuj ponownie.");
                return;
            }

            setSelectedPoint({
                name,
                address,
            });

            setIsGeoDialogOpen(false);
        };

        document.addEventListener(onPointEventName, handler);
        return () => document.removeEventListener(onPointEventName, handler);
    }, [isGeoDialogOpen, onPointEventName]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const openInPostModal = () => {
        if (!geowidgetToken) {
            toast.error("Brak tokenu Geowidgetu. Ustaw go w panelu administracyjnym.");
            return;
        }

		if (!geowidgetConfig) {
			toast.error("Brak konfiguracji Geowidgetu (config). Ustaw ją w panelu administracyjnym.");
			return;
		}

        if (hasMapError) {
             toast.error("Nie udało się załadować mapy InPost. Odśwież stronę lub sprawdź blokowanie reklam.");
             return;
        }

        if (!isMapScriptLoaded) {
            console.warn("Attempted to open InPost map before script load complete.");
            toast.error("Mapa InPost jeszcze się ładuje. Proszę czekać...");
            return;
        }

        if (typeof window !== "undefined" && typeof window.customElements !== "undefined") {
            if (!window.customElements.get("inpost-geowidget")) {
                toast.error("Widget InPost nie jest jeszcze gotowy. Odśwież stronę i spróbuj ponownie.");
                return;
            }
        }

        setIsGeoDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.error("Wybierz przynajmniej jedną próbkę.");
            return;
        }

        // Walidacja danych kontaktowych
        if (!recipient.name || !recipient.email || !recipient.phone) {
            toast.error("Uzupełnij dane kontaktowe (Imię, Email, Telefon).");
            return;
        }

        if (deliveryMethod === 'parcel_locker' && !selectedPoint) {
            toast.error("Proszę wybrać Paczkomat z mapy.");
            return;
        }

        if (deliveryMethod === 'courier') {
            if (!address.street || !address.buildingNumber || !address.city || !address.postalCode) {
                toast.error("Uzupełnij pełny adres dostawy.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await submitSampleRequest(token, selectedIds, {
                method: deliveryMethod,
                recipient,
                address: deliveryMethod === 'courier' ? address : undefined,
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
                id="inpost-geowidget-script"
                src={`https://geowidget.inpost.pl/inpost-geowidget.js?token=${encodeURIComponent(geowidgetToken || "")}`}
                strategy="afterInteractive"
                onReady={initMap}
                onError={() => {
                    setIsMapScriptLoaded(false);
                    setHasMapError(true);
                    toast.error("Nie udało się załadować mapy InPost. Sprawdź połączenie lub wyłącz blokowanie reklam.");
                }}
            />

            <Dialog open={isGeoDialogOpen} onOpenChange={setIsGeoDialogOpen}>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle>Wybierz Paczkomat</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        <div className="h-[70vh] min-h-[520px] w-full rounded-lg overflow-hidden border">
                            <inpost-geowidget
                                ref={(el) => {
								geoWidgetRef.current = el;
							}}
                                className="block h-full w-full"
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                            <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground mb-4 overflow-hidden relative">
                                {sample.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={sample.imageUrl} 
                                        alt={sample.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-10 w-10 opacity-20" />
                                )}
                            </div>
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
                            <div className="text-center text-xs text-muted-foreground mt-1">Dostawa do domu</div>
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

                {/* Dane Kontaktowe (Zawsze) */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">Twoje Dane Kontaktowe</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Imię i Nazwisko</Label>
                            <Input 
                                id="recipientName" 
                                placeholder="Janowalski" 
                                value={recipient.name}
                                onChange={(e) => setRecipient(prev => ({...prev, name: e.target.value}))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientPhone">Telefon</Label>
                            <Input 
                                id="recipientPhone" 
                                placeholder="500600700" 
                                value={recipient.phone}
                                onChange={(e) => setRecipient(prev => ({...prev, phone: e.target.value}))}
                            />
                            <p className="text-xs text-muted-foreground">Wymagany przez InPost do powiadomień SMS.</p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="recipientEmail">Adres E-mail</Label>
                            <Input 
                                id="recipientEmail" 
                                type="email"
                                placeholder="jan@przyklad.pl" 
                                value={recipient.email}
                                onChange={(e) => setRecipient(prev => ({...prev, email: e.target.value}))}
                            />
                        </div>
                    </div>
                </div>

                {deliveryMethod === 'courier' && (
                     <div className="bg-muted/50 p-6 rounded-lg space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                        <h3 className="font-semibold text-lg">Adres Dostawy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-1">
                                <Label>Ulica</Label>
                                <Input 
                                    placeholder="Marszałkowska" 
                                    value={address.street} 
                                    onChange={e => setAddress(prev => ({...prev, street: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-1">
                                <Label>Nr domu / lokalu</Label>
                                <Input 
                                    placeholder="1/2" 
                                    value={address.buildingNumber} 
                                    onChange={e => setAddress(prev => ({...prev, buildingNumber: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kod pocztowy</Label>
                                <Input 
                                    placeholder="00-001" 
                                    value={address.postalCode} 
                                    onChange={e => setAddress(prev => ({...prev, postalCode: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Miasto</Label>
                                <Input 
                                    placeholder="Warszawa" 
                                    value={address.city} 
                                    onChange={e => setAddress(prev => ({...prev, city: e.target.value}))}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
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
                                <Button variant="outline" size="sm" onClick={openInPostModal} className="mt-2" disabled={!isMapScriptLoaded && !hasMapError}>
                                    {hasMapError ? "Błąd mapy" : (isMapScriptLoaded ? "Zmień punkt" : "Ładowanie...")}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold">Wybierz punkt odbioru</h3>
                                    <p className="text-sm text-muted-foreground">Kliknij przycisk poniżej, aby otworzyć mapę.</p>
                                </div>
                                <Button onClick={openInPostModal} className="w-full sm:w-auto" size="lg" disabled={!isMapScriptLoaded && !hasMapError}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {hasMapError ? "Spróbuj ponownie" : (isMapScriptLoaded ? "Otwórz mapę Paczkomatów" : "Ładowanie mapy...")}
                                </Button>
                            </>
                        )}
                    </div>
                )}

                <p className="text-xs text-muted-foreground text-center px-4">
                    Podane dane osobowe zostaną wykorzystane wyłącznie w celu realizacji wysyłki próbek.
                </p>
            </div>

            <div className="sticky bottom-4 mx-auto max-w-md z-50">
                <div className="bg-background/95 backdrop-blur-md border rounded-full p-2 shadow-2xl flex items-center justify-between pl-6 pr-2 ring-1 ring-border/50">
                    <div className="font-medium text-sm">
                        Wybrano: <span className="font-bold text-primary">{selectedIds.length}</span>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedIds.length === 0} size="lg" className="rounded-full shadow-md">
                        {isSubmitting ? "Wysyłanie..." : "Zamawiam (Bezpłatnie)"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
