"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePortalSettings, fixMontageCustomerLinks } from "../actions";

const formSchema = z.object({
  portalEnabled: z.boolean(),
  smsProvider: z.string().min(1, "Wybierz dostawcę SMS"),
  smsToken: z.string().optional(),
  smsSenderName: z.string().optional(),
});

interface PortalSettingsFormProps {
  initialEnabled: boolean;
  initialSmsProvider: string;
  initialSmsToken: string;
  initialSmsSenderName: string;
}

export function PortalSettingsForm({
  initialEnabled,
  initialSmsProvider,
  initialSmsToken,
  initialSmsSenderName,
}: PortalSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portalEnabled: initialEnabled,
      smsProvider: initialSmsProvider || "smsapi",
      smsToken: initialSmsToken || "",
      smsSenderName: initialSmsSenderName || "Info",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      await updatePortalSettings({
        portalEnabled: values.portalEnabled,
        smsProvider: values.smsProvider,
        smsToken: values.smsToken || "",
        smsSenderName: values.smsSenderName || "",
      });
      toast.success("Ustawienia portalu zostały zapisane");
    } catch (error) {
      toast.error("Wystąpił błąd podczas zapisywania ustawień");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function onFixLinks() {
      setIsFixing(true);
      try {
          const result = await fixMontageCustomerLinks();
          toast.success(`Naprawiono ${result.fixedCount} z ${result.totalFound} montaży.`);
      } catch (error) {
          toast.error("Błąd podczas naprawy danych.");
          console.error(error);
      } finally {
          setIsFixing(false);
      }
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Portal Klienta i Powiadomienia SMS</CardTitle>
        <CardDescription>
          Konfiguracja dostępu do portalu klienta oraz bramki SMS do wysyłania powiadomień.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="portalEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Włącz Portal Klienta
                    </FormLabel>
                    <FormDescription>
                      Pozwól klientom na podgląd statusu zamówienia przez unikalny link.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="smsProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dostawca SMS</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz dostawcę" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smsapi">SMSAPI.pl</SelectItem>
                        {/* Future providers can be added here */}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Wybierz bramkę SMS do obsługi wysyłki.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="smsSenderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa nadawcy (Sender Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Info" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nazwa, która wyświetli się klientowi jako nadawca SMS. Musi być zarejestrowana u dostawcy.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="smsToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token API (OAuth / Bearer)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Wprowadź token API..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Klucz dostępu do API wybranego dostawcy SMS.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isSaving && <Save className="mr-2 h-4 w-4" />}
                Zapisz ustawienia
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Naprawa Danych</CardTitle>
            <CardDescription>
                Narzędzia do naprawy spójności danych w systemie.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="font-medium">Powiązania Montaży z Klientami</p>
                    <p className="text-sm text-muted-foreground">
                        Uruchom ten proces, jeśli montaże nie wyświetlają się w portalu klienta mimo zgodności adresu e-mail.
                    </p>
                </div>
                <Button variant="outline" onClick={onFixLinks} disabled={isFixing}>
                    {isFixing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Napraw Powiązania
                </Button>
            </div>
        </CardContent>
    </Card>
    </div>
  );
}
