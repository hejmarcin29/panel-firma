"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTransition, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Package, Truck, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { processOrder } from "@/app/(storefront)/checkout/actions";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Script from "next/script";

const phoneRegex = /^(?:\+48)?\s?\d{3}[-\s]?\d{3}[-\s]?\d{3}$/;

const checkoutSchema = z.object({
  // Contact
  firstName: z.string().min(2, "Imię jest wymagane"),
  lastName: z.string().min(2, "Nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres email"),
  phone: z.string().regex(phoneRegex, "Nieprawidłowy numer telefonu"),
  
  // Shipping
  street: z.string().min(2, "Ulica i numer są wymagane"),
  postalCode: z.string().min(5, "Kod pocztowy jest wymagany"),
  city: z.string().min(2, "Miejscowość jest wymagana"),
  
  // Billing
  isCompany: z.boolean().default(false),
  companyName: z.string().optional(),
  nip: z.string().optional(),
  
  // Logic
  differentBillingAddress: z.boolean().default(false),
  billingStreet: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCity: z.string().optional(),

  // Payment
  paymentMethod: z.enum(["proforma", "tpay"]),
  
  // Legal
  acceptTerms: z.boolean().refine((val) => val === true, "Wymagana akceptacja regulaminu"),
}).superRefine((data, ctx) => {
  if (data.isCompany) {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nazwa firmy jest wymagana",
        path: ["companyName"],
      });
    }
    if (!data.nip) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NIP jest wymagany",
        path: ["nip"],
      });
    }
  }

  if (data.differentBillingAddress) {
    if (!data.billingStreet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ulica (faktura) jest wymagana",
        path: ["billingStreet"],
      });
    }
    if (!data.billingPostalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kod pocztowy (faktura) jest wymagany",
        path: ["billingPostalCode"],
      });
    }
    if (!data.billingCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Miejscowość (faktura) jest wymagana",
        path: ["billingCity"],
      });
    }
  }
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
    shippingCost?: number; 
    palletShippingCost?: number;
    inpostGeowidgetToken?: string;
    inpostGeowidgetConfig?: string;
    turnstileSiteKey?: string; // Cloudflare Turnstile
}

declare global {
  interface Window {
      turnstile: any;
      turnstileLoaded: () => void;
  }
}

export function CheckoutForm({ shippingCost, palletShippingCost, inpostGeowidgetToken, inpostGeowidgetConfig, turnstileSiteKey }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { items, getTotalPrice, getDetailedTotals } = useCartStore();
  const itemsTotal = getTotalPrice();
  const totals = getDetailedTotals();

  // Turnstile State
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);

  // Load Turnstile Script if key present
  useEffect(() => {
      if (!turnstileSiteKey) return;

      const scriptId = 'cf-turnstile-script';
      if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);
      }

      const renderWidget = () => {
           if (window.turnstile && !turnstileWidgetId) {
              try {
                  const id = window.turnstile.render('#turnstile-checkout-container', {
                      sitekey: turnstileSiteKey,
                      theme: 'light',
                      callback: (token: string) => setTurnstileToken(token),
                      'expired-callback': () => setTurnstileToken(null),
                  });
                  setTurnstileWidgetId(id);
              } catch {
                  // Container might not be ready yet
              }
           }
      };

      if (window.turnstile) {
          // ensure container is mounted
          setTimeout(renderWidget, 100); 
      } else {
           const interval = setInterval(() => {
              if (window.turnstile) {
                  clearInterval(interval);
                  renderWidget();
              }
           }, 100);
           return () => clearInterval(interval);
      }
  }, [turnstileSiteKey, turnstileWidgetId]);

  const isOnlySamples = items.length > 0 && items.every(item => item.productId.startsWith('sample_'));
  
  // Delivery State
  const [internalDeliveryMethod, setInternalDeliveryMethod] = useState<'courier' | 'locker'>('courier');
  // Derived state: If not samples (pallets), force courier.
  const deliveryMethod = isOnlySamples ? internalDeliveryMethod : 'courier';
  
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  // InPost Script State
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const onPointEventName = useMemo(() => "onpointselect", []);

  const initMap = useCallback(() => {
     setIsMapScriptLoaded(true);
  }, []);

  // Check if script is already loaded
  useEffect(() => {
      if (typeof window !== "undefined" && window.customElements?.get("inpost-geowidget")) {
          initMap();
      }
  }, [initMap]);

  // --- MOVED START: form definition ---
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      isCompany: false,
      differentBillingAddress: false,
      paymentMethod: isOnlySamples ? "tpay" : "proforma",
      acceptTerms: false,
    },
  });
  // --- MOVED END ---

  // Handle Geowidget Rendering and Events
  useEffect(() => {
      if (!mapOpen || !isMapScriptLoaded || hasMapError || !mapContainerRef.current) return;
      
      const container = mapContainerRef.current;
      container.replaceChildren();

      const widget = document.createElement("inpost-geowidget");
      widget.setAttribute("token", (inpostGeowidgetToken || "").trim());
      widget.setAttribute("config", (inpostGeowidgetConfig || "parcelCollect").trim());
      widget.setAttribute("language", "pl");
      widget.setAttribute("onpoint", onPointEventName);
      widget.className = "block h-full w-full";
      container.appendChild(widget);

      setTimeout(() => {
            if (widget.shadowRoot) {
                const style = document.createElement('style');
                style.textContent = `
                    input:focus, button:focus, .geo-input:focus {
                        outline: none !important;
                        box-shadow: none !important;
                        border-color: #cbd5e1 !important; /* slate-300 */
                    }
                `;
                widget.shadowRoot.appendChild(style);
            }
      }, 100);

      const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            const point = customEvent?.detail;
            console.log("Selected Point:", point);
            
            setSelectedPoint({
                name: point.name,
                address: `${point.address_details.street} ${point.address_details.building_number}, ${point.address_details.city}`,
                description: point.location_description
            });
            
            form.setValue("street", `Paczkomat ${point.name}`);
            form.setValue("postalCode", point.address_details.post_code);
            form.setValue("city", point.address_details.city);
            
            setMapOpen(false);
            toast.success(`Wybrano paczkomat: ${point.name}`);
      };

      document.addEventListener(onPointEventName, handler);
      return () => {
          document.removeEventListener(onPointEventName, handler);
          container.replaceChildren();
      };
  }, [mapOpen, isMapScriptLoaded, hasMapError, onPointEventName, inpostGeowidgetToken, inpostGeowidgetConfig, form]);

  // Calculate Shipping (shippingCost is in grosze)
  const activeShippingCostInt = isOnlySamples 
      ? (deliveryMethod === 'locker' ? (shippingCost || 0) : (shippingCost || 0)) // Could have different cost for locker later
      : (palletShippingCost || 0);
  
  const shippingCostPLN = activeShippingCostInt / 100;
  // Calculate VAT for shipping (assumed 23%)
  const shippingVat = shippingCostPLN - (shippingCostPLN / 1.23);
  
  const finalTotal = itemsTotal + shippingCostPLN;
  const totalVat = totals.totalVat + shippingVat;

  const isCompany = useWatch({ control: form.control, name: "isCompany" });
  const differentBillingAddress = useWatch({ control: form.control, name: "differentBillingAddress" });

  const onSubmit = (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error("Twój koszyk jest pusty");
      return;
    }

    if (deliveryMethod === 'locker' && !selectedPoint) {
        toast.error("Proszę wybrać Paczkomat");
        return;
    }

    if (turnstileSiteKey && !turnstileToken) {
       toast.error("Weryfikacja anty-spam nie powiodła się. Odśwież stronę.");
       return;
    }

    const orderItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.pricePerUnit,
        vatRate: item.vatRate,
        unit: item.unit
    }));
    
    startTransition(async () => {
      const result = await processOrder({
        ...data,
        items: orderItems,
        totalAmount: finalTotal,
        deliveryMethod,
        deliveryPoint: selectedPoint || undefined,
        turnstileToken: turnstileToken || undefined,
      });afterInteractive" 
                    onReady={initMap}
                    onError={() => {
                        setIsMapScriptLoaded(false);
                        setHasMapError(true);
                        toast.error("Nie udało się załadować mapy InPost. Sprawdź połączenie.");
                    }
      if (result.success) {
        toast.success("Zamówienie zostało złożone!");
        useCartStore.getState().clearCart();
        if (window.turnstile && turnstileWidgetId) {
           try { window.turnstile.remove(turnstileWidgetId); } catch {}
        }
        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            router.push(`/sklep/dziekujemy?orderId=${result.orderId}`);
        }
      } else {
        toast.error(result.message || "Wystąpił błąd");
      }
    });
  };

  if (items.length === 0) {
      return (
          <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Twój koszyk jest pusty</h2>
              <Button onClick={() => router.push('/sklep')}>Wróć do sklepu</Button>
          </div>
      )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
        {/* Load InPost Assets */}
        {inpostGeowidgetToken && (
             <>
                <Script 
                    src="https://geowidget.inpost.pl/inpost-geowidget.js" 
                    strategy="lazyOnload" 
                    onLoad={() => setInpostLoaded(true)}
                />
                <link rel="stylesheet" href="https://geowidget.inpost.pl/inpost-geowidget.css" />
             </>
        )}

      <div className="lg:col-span-2 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Dane Zamawiającego (Kontakt & Firma) */}
            <Card>
              <CardHeader>
                <CardTitle>Dane Zamawiającego</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 {/* Typ Klienta Switch */}
                 <Tabs
                    defaultValue={isCompany ? "company" : "person"}
                    onValueChange={(v) => form.setValue("isCompany", v === "company")}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="person">Osoba Prywatna</TabsTrigger>
                        <TabsTrigger value="company">Firma</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Pola Firmowe */}
                {isCompany && (
                   <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
                     <FormField
                        control={form.control}
                        name="nip"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>NIP</FormLabel>
                            <FormControl>
                                <Input placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nazwa Firmy</FormLabel>
                            <FormControl>
                                <Input placeholder="Firma Sp. z o.o." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                   </div>
                )}

                {/* Dane Kontaktowe */}
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Imię</FormLabel>
                        <FormControl>
                            <Input placeholder="Jan" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nazwisko</FormLabel>
                        <FormControl>
                            <Input placeholder="Kowalski" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="jan@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                            <Input placeholder="123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </CardContent>
            </Card>

            {/* 2. Metoda Dostawy & Adres */}
            <Card>
              <CardHeader>
                <CardTitle>Adres Dostawy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  {/* Delivery Switches */}
                  {isOnlySamples ? (
                      <Tabs value={deliveryMethod} onValueChange={(v) => setInternalDeliveryMethod(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="courier">
                                <Truck className="mr-2 h-4 w-4" />
                                Kurier
                            </TabsTrigger>
                            <TabsTrigger value="locker">
                                <Package className="mr-2 h-4 w-4" />
                                Paczkomat InPost
                            </TabsTrigger>
                        </TabsList>
                      </Tabs>
                  ) : (
                      <Alert className="bg-blue-50 border-blue-200">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">Dostawa paletowa</AlertTitle>
                          <AlertDescription className="text-blue-700">
                              Dla paneli podłogowych dostępna jest tylko dostawa kurierem paletowym.
                          </AlertDescription>
                      </Alert>
                  )}

                {/* Locker Logic */}
                {deliveryMethod === 'locker' && isOnlySamples ? (
                    <div className="space-y-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            {selectedPoint ? (
                                <div className="text-center space-y-2 w-full">
                                    <div className="flex items-center justify-center p-3 bg-white rounded-full w-12 h-12 shadow-sm mx-auto">
                                        <Package className="h-6 w-6 text-yellow-500" />
                                    </div>
                                    <div className="font-semibold text-lg">{selectedPoint.name}</div>
                                    <div className="text-sm text-muted-foreground">{selectedPoint.address}</div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
                                        Zmień paczkomat
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground text-center mb-2">
                                        Wybierz punkt odbioru z mapy. Paczka będzie czekać w Paczkomacie.
                                    </p>
                                    <Button type="button" onClick={() => setMapOpen(true)} className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Wybierz Paczkomat
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        {/* Hidden fields needed for Zod schema but hidden from user */}
                        <div className="hidden">
                             <Input {...form.register('street')} />
                             <Input {...form.register('postalCode')} />
                             <Input {...form.register('city')} />
                        </div>
                    </div>
                ) : (
                   /* Courier Form */
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control as any}
                    name="street"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                        <FormLabel>Ulica i numer</FormLabel>
                        <FormControl>
                            <Input placeholder="ul. Kwiatowa 12/3" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control as any}
                    name="postalCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kod Pocztowy</FormLabel>
                        <FormControl>
                            <Input placeholder="00-000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control as any}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Miejscowość</FormLabel>
                        <FormControl>
                            <Input placeholder="Warszawa" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                  </div>
                )}

                {/* Billing Address Toggle Logic */}
                <div className="pt-6 border-t mt-6">
                    <FormField
                      control={form.control}
                      name="differentBillingAddress"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer font-medium">
                              Chcę podać inny adres na fakturze
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                                Zaznacz, jeśli dane do faktury różnią się od adresu dostawy.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                </div>

                {/* Billing Address Fields */}
                {differentBillingAddress && (
                    <div className="grid gap-4 md:grid-cols-2 pt-4 animate-in fade-in slide-in-from-top-2 border-t mt-4 border-dashed">
                       <h3 className="col-span-2 font-medium text-sm text-muted-foreground mb-2">Adres na Fakturze</h3>
                       <FormField
                        control={form.control}
                        name="billingStreet"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                            <FormLabel>Ulica i numer (Faktura)</FormLabel>
                            <FormControl>
                                <Input placeholder="ul. Biurowa 1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="billingCity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Miejscowość (Faktura)</FormLabel>
                            <FormControl>
                                <Input placeholder="Warszawa" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                )}
              </CardContent>
            </Card>

            {/* InPost Map Modal */}
            <Dialog open={mapOpen} onOpenChange={setMapOpen}>
                <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
                    <div className="flex-1 w-full h-full relative bg-gray-100">
                        {inpostLoaded ? (
                            <inpost-geowidget
                                token={inpostGeowidgetToken}
                                language="pl"
                                config={inpostGeowidgetConfig || "parcelCollect"}
                                style={{
                                    width: "100%", 
                                    height: "100%",
                                    position: "absolute",
                                    top: 0,
                                    left: 0
                                }}
                            ></inpost-geowidget>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-500">Ładowanie mapy...</span>
                            </div>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 z-50 bg-white/80 hover:bg-white"
                            onClick={() => setMapOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 4. Metoda Płatności */}
            <Card>
              <CardHeader>
                <CardTitle>Płatność</CardTitle>
              </CardHeader>
              <CardContent>
                 {!isOnlySamples && (
                     <Alert className="mb-6 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Dostawa paletowa</AlertTitle>
                        <AlertDescription className="text-amber-700">
                           Twoje zamówienie zawiera produkty wielkogabarytowe (podłogi). 
                           Wymagana jest walidacja stanów magazynowych, 
                           dlatego jedyną dostępną metodą jest proforma. 
                           Nasz opiekun potwierdzi zamówienie zanim dokonasz wpłaty.
                        </AlertDescription>
                     </Alert>
                 )}

                 <FormField
                  control={form.control as any}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {/* Proforma */}
                          <FormItem className={`flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-white ${isOnlySamples ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}>
                            <FormControl>
                              <RadioGroupItem value="proforma" disabled={isOnlySamples} />
                            </FormControl>
                            <FormLabel className="font-normal flex-1 cursor-pointer">
                                <div className="font-semibold">Przelew tradycyjny (Proforma)</div>
                                <div className="text-sm text-muted-foreground">
                                    {isOnlySamples 
                                        ? "Niedostępne dla zamówień próbek (wymagana szybka płatność)."
                                        : "Otrzymasz fakturę proforma mailem. Towar wysyłamy po zaksięgowaniu wpłaty."}
                                </div>
                            </FormLabel>
                          </FormItem>

                          {/* Tpay - Only for samples */}
                          <FormItem className={`flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-white ${!isOnlySamples ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}>
                            <FormControl>
                              <RadioGroupItem value="tpay" disabled={!isOnlySamples} />
                            </FormControl>
                            <FormLabel className="font-normal flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Szybki przelew / BLIK (Tpay)</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {isOnlySamples 
                                        ? "Płatność natychmiastowa. Szybka wysyłka próbek." 
                                        : "Niedostępne dla zamówień paletowych."}
                                </div>
                            </FormLabel>
                          </FormItem>
                          
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <FormField
              control={form.control as any}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mt-0! text-sm">
                    Oświadczam, że zapoznałem się i akceptuję Regulamin sklepu oraz Politykę Prywatności.
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Turnstile Widget */}
            <div id="turnstile-checkout-container" className="flex justify-start min-h-[65px]" />

            <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Przetwarzanie..." : `Zamawiam i płacę (${finalTotal.toFixed(2)} zł)`}
            </Button>
          </form>
        </Form>
      </div>

      {/* Podsumowanie (Prawa kolumna) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
             <Card>
                 <CardHeader>
                     <CardTitle>Podsumowanie</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {items.map((item) => (
                         <div key={item.productId} className="flex justify-between text-sm py-2 border-b last:border-0 border-dashed">
                             <div className="space-y-1">
                                 <span className="font-medium">{item.name}</span>
                                 <div className="text-muted-foreground text-xs space-y-0.5">
                                     {item.unit === 'm2' && item.packageSize ? (
                                         <>
                                             <div>Ilość: <span className="font-medium text-foreground">{(item.quantity * item.packageSize).toFixed(3)} m²</span></div>
                                             <div>Opakowania: {item.quantity} op. ({item.packageSize} m²/op)</div>
                                         </>
                                     ) : (
                                         <div>Ilość: <span className="font-medium text-foreground">{item.quantity} szt.</span></div>
                                     )}
                                 </div>
                             </div>
                             <span className="font-medium whitespace-nowrap">{(item.pricePerUnit * item.quantity).toFixed(2)} zł</span>
                         </div>
                     ))}
                     
                     <Separator className="my-4" />
                     
                     <div className="space-y-2">
                         <div className="flex justify-between font-medium">
                             <span>Suma produktów</span>
                             <span>{totals.totalGross.toFixed(2)} zł</span>
                         </div>
                         <div className="flex justify-between text-sm text-muted-foreground">
                         <span>
                             Dostawa ({deliveryMethod === 'locker' 
                                ? 'Paczkomat' 
                                : (!isOnlySamples ? 'Spedycja' : 'Kurier')
                             })
                         </span>
                         {shippingCostPLN > 0 ? (
                             <span>{shippingCostPLN.toFixed(2)} zł</span>
                         ) : (
                             <span>Gratis / Wyceniana indywidualnie</span>
                         )}
                     </div>
                     {/* VAT Display */}
                     <div className="flex justify-between text-xs text-muted-foreground/70 pt-1">
                         <span>w tym VAT</span>
                         <span>{totalVat.toFixed(2)} zł</span>
                     </div>
                 </div>
                     
                     <Separator className="my-4" />
                     
                     <div className="flex justify-between font-bold text-xl">
                         <span>Do zapłaty</span>
                         <span>{finalTotal.toFixed(2)} zł</span>
                     </div>
                 </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
