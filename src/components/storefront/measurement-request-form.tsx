"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { submitLeadAction } from "@/app/(storefront)/_actions/submit-lead";
import Script from "next/script";

const formSchema = z.object({
  name: z.string().min(2, "Imię i nazwisko jest wymagane"),
  phone: z.string().min(9, "Numer telefonu jest wymagany"),
  email: z.string().email("Nieprawidłowy e-mail"),
  city: z.string().min(2, "Miejscowość jest wymagana"),
  message: z.string().min(1, "Wiadomość jest wymagana"),
  _gotcha: z.string().optional(),
});

interface MeasurementRequestFormProps {
    defaultMessage?: string;
    onSuccess?: () => void;
}

export function MeasurementRequestForm({ defaultMessage, onSuccess }: MeasurementRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      message: defaultMessage || "Dzień dobry, proszę o wycenę montażu podłogi...",
      _gotcha: "",
    },
  });

  // Turnstile Init
  useEffect(() => {
      // If turnstile script is loaded, render widget
      if ((window as any).turnstile) {
          try {
             const id = (window as any).turnstile.render("#turnstile-container", {
                 sitekey: "0x4AAAAAACLPyp7wyrIDy3Lq",
                 theme: "light",
                 callback: (token: string) => setTurnstileToken(token),
             });
             turnstileRef.current = id;
          } catch(e) {
              console.log("Turnstile render error (container might not be ready)", e);
          }
      }

      return () => {
          if (turnstileRef.current && (window as any).turnstile) {
              try { (window as any).turnstile.remove(turnstileRef.current); } catch {}
          }
      }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Basic Turnstile check client-side
    // if (!turnstileToken) {
    //     toast.error("Potwierdź, że nie jesteś robotem (Turnstile).");
    //     return;
    // }

    setIsSubmitting(true);
    try {
      const result = await submitLeadAction({
          ...values,
          turnstileToken: turnstileToken || undefined
      });

      if (result.success) {
        toast.success(result.message);
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" 
        strategy="lazyOnload" 
        onLoad={() => {
             // Retry render on load
             if ((window as any).turnstile && !turnstileRef.current) {
                try {
                    const id = (window as any).turnstile.render("#turnstile-container", {
                        sitekey: "0x4AAAAAACLPyp7wyrIDy3Lq",
                        theme: "light",
                        callback: (token: string) => setTurnstileToken(token),
                    });
                    turnstileRef.current = id;
                } catch {}
             }
        }}
      />
      
      <div className="bg-blue-50/50 p-4 rounded-lg flex items-start gap-3 border border-blue-100 mb-4">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Montaż z VAT 8% (oszczędzasz 15%)</p>
            <p>Usługa dostępna dla budownictwa mieszkaniowego (do 150m²) i domów jednorodzinnych (do 300m²).</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          
          <div className="grid grid-cols-2 gap-3">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem className="col-span-2">
                    <FormLabel>Imię i nazwisko <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                <FormItem className="col-span-1">
                    <FormLabel>Telefon <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                    <Input placeholder="123 456 789" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                <FormItem className="col-span-1">
                    <FormLabel>Miasto <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                    <Input placeholder="Warszawa" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="jan@przykladowy.pl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wiadomość / Zakres prac</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Interesuje mnie montaż podłogi winylowej z klejeniem..." 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Honeypot */}
          <input type="text" {...form.register("_gotcha")} className="hidden" tabIndex={-1} autoComplete="off" />
          
          {/* Turnstile Container */}
          <div id="turnstile-container" className="my-2 min-h-[65px]" />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12" disabled={isSubmitting}>
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wysyłanie...
                </>
            ) : (
                "Wyślij Zgłoszenie (Pomiar GRATIS)"
            )}
          </Button>
          
          <p className="text-[10px] text-muted-foreground text-center pt-2">
             Wysyłając formularz akceptujesz Politykę Prywatności. Twoje dane są bezpieczne (RODO).
          </p>
        </form>
      </Form>
    </div>
  );
}
