"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { processOrder } from "../actions";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const cart = useCartStore();
  const totalAmount = cart.getTotalPrice();

  // Logic: Is only samples?
  const isOnlySamples = cart.items.length > 0 && cart.items.every(item => item.productId.startsWith('sample_'));

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      isCompany: false,
      differentBillingAddress: false,
      paymentMethod: isOnlySamples ? "tpay" : "proforma",
      acceptTerms: false,
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    if (cart.items.length === 0) {
      toast.error("Twój koszyk jest pusty");
      return;
    }

    const orderData = {
        ...data,
        items: cart.items.map(item => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.pricePerUnit,
            vatRate: item.vatRate,
            unit: item.unit
        })),
        totalAmount
    }

    startTransition(async () => {
      try {
        const result = await processOrder(orderData);
        
        if (result.success) {
            cart.clearCart();
            toast.success("Zamówienie zostało złożone!");
            
            if ((result as any).redirectUrl) {
                window.location.href = (result as any).redirectUrl;
            } else {
                router.push(`/checkout/success?orderId=${result.orderId}`);
            }
        } else {
            toast.error(result.message || "Wystąpił błąd podczas składania zamówienia");
        }
      } catch (error) {
        toast.error("Nie udało się złożyć zamówienia");
        console.error(error);
      }
    });
  };

  if (cart.items.length === 0) {
      return (
          <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Twój koszyk jest pusty</h2>
              <Button onClick={() => router.push('/sklep')}>Wróć do sklepu</Button>
          </div>
      )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Dane Kontaktowe */}
            <Card>
              <CardHeader>
                <CardTitle>Dane Kontaktowe</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
              </CardContent>
            </Card>

            {/* 2. Adres Dostawy */}
            <Card>
              <CardHeader>
                <CardTitle>Adres Dostawy</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
              </CardContent>
            </Card>

            {/* 3. Dane do Faktury */}
            <Card>
              <CardHeader>
                <CardTitle>Dane do Faktury</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="isCompany"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Chcę otrzymać fakturę na firmę (NIP)</FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("isCompany") && (
                   <div className="grid gap-4 md:grid-cols-2">
                     <FormField
                        control={form.control as any}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                            <FormLabel>Nazwa Firmy</FormLabel>
                            <FormControl>
                                <Input placeholder="Firma Sp. z o.o." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control as any}
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
                   </div>
                )}

                <Separator className="my-4" />

                <FormField
                  control={form.control as any}
                  name="differentBillingAddress"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Inny adres na fakturze</FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("differentBillingAddress") && (
                   <div className="grid gap-4 md:grid-cols-2 mt-4">
                      <FormField
                        control={form.control as any}
                        name="billingStreet"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                            <FormLabel>Ulica i numer</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control as any}
                        name="billingPostalCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Kod Pocztowy</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control as any}
                        name="billingCity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Miejscowość</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                   </div>
                )}
              </CardContent>
            </Card>

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
                          {/* Proforma - Always Available */}
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-white">
                            <FormControl>
                              <RadioGroupItem value="proforma" />
                            </FormControl>
                            <FormLabel className="font-normal flex-1 cursor-pointer">
                                <div className="font-semibold">Przelew tradycyjny (Proforma)</div>
                                <div className="text-sm text-muted-foreground">
                                    Otrzymasz fakturę proforma mailem. Towar wysyłamy po zaksięgowaniu wpłaty.
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
                  <FormLabel className="!mt-0 text-sm">
                    Oświadczam, że zapoznałem się i akceptuję Regulamin sklepu oraz Politykę Prywatności.
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Przetwarzanie..." : `Zamawiam i płacę (${totalAmount.toFixed(2)} zł)`}
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
                     {cart.items.map((item) => (
                         <div key={item.productId} className="flex justify-between text-sm">
                             <div className="space-y-1">
                                 <span className="font-medium">{item.name}</span>
                                 <div className="text-muted-foreground text-xs">
                                     {item.quantity} x {item.unit}
                                 </div>
                             </div>
                             <span>{(item.pricePerUnit * item.quantity).toFixed(2)} zł</span>
                         </div>
                     ))}
                     
                     <Separator />
                     
                     <div className="flex justify-between font-medium">
                         <span>Suma produktów</span>
                         <span>{totalAmount.toFixed(2)} zł</span>
                     </div>
                     <div className="flex justify-between text-sm text-muted-foreground">
                         <span>Dostawa</span>
                         <span>Wyceniana indywidualnie / Gratis od 4000 zł</span>
                     </div>
                     
                     <Separator className="my-2" />
                     
                     <div className="flex justify-between font-bold text-lg">
                         <span>Do zapłaty</span>
                         <span>{totalAmount.toFixed(2)} zł</span>
                     </div>
                 </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}

