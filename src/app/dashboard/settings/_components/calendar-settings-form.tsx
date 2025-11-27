"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Shield } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { updateCalendarSettings } from "../actions";
import { ConfigurationGuide } from "./configuration-guide";

export const calendarSettingsSchema = z.object({
  conflictPolicy: z.enum(["allow", "warn", "block"]),
  defaultDuration: z.coerce.number().min(1).max(24),
  enableTravelBuffer: z.boolean(),
  travelBufferMinutes: z.coerce.number().min(0).max(120),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  hideWeekends: z.boolean(),
  googleCalendarSync: z.boolean(),
});

export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;

export function CalendarSettingsForm({
  initialSettings,
}: {
  initialSettings: CalendarSettings;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CalendarSettings>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(calendarSettingsSchema) as any,
    defaultValues: initialSettings,
  });

  const enableTravelBuffer = useWatch({
    control: form.control,
    name: "enableTravelBuffer",
  });

  function onSubmit(data: CalendarSettings) {
    startTransition(async () => {
      await updateCalendarSettings(data);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Smart Scheduling
            </CardTitle>
            <CardDescription>
              Konfiguracja logiki planowania i wykrywania konfliktów.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="conflictPolicy"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Polityka konfliktów</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="allow" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Zezwalaj (Ignoruj konflikty)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="warn" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Ostrzegaj (Zalecane)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="block" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Blokuj (Nie pozwalaj na nakładanie się terminów)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="defaultDuration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Domyślny czas montażu (h)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                        Domyślna długość nowego montażu.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <Separator />

            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="enableTravelBuffer"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            Bufor czasowy na dojazd
                            </FormLabel>
                            <FormDescription>
                            Automatycznie dodaj czas po montażu.
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
                
                {enableTravelBuffer && (
                    <FormField
                    control={form.control}
                    name="travelBufferMinutes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Czas bufora (minuty)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Wygląd Kalendarza
            </CardTitle>
            <CardDescription>
              Dostosuj widok kalendarza do swoich potrzeb.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="workingHoursStart"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Początek dnia</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="workingHoursEnd"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Koniec dnia</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>

             <FormField
                control={form.control}
                name="hideWeekends"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                        Ukryj weekendy
                        </FormLabel>
                        <FormDescription>
                        Pokaż tylko dni robocze (Pon-Pt).
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
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Integracja Google Calendar
                        </CardTitle>
                        <CardDescription>
                            Synchronizuj montaże z kalendarzem Google.
                        </CardDescription>
                    </div>
                    <ConfigurationGuide type="google" />
                </div>
            </CardHeader>
            <CardContent>
                 <FormField
                    control={form.control}
                    name="googleCalendarSync"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            Synchronizacja aktywna
                            </FormLabel>
                            <FormDescription>
                            Wysyłaj nowe montaże do Google Calendar.
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
                <div className="mt-4 p-4 bg-muted rounded-md text-sm text-muted-foreground">
                    Aby w pełni skonfigurować integrację, skontaktuj się z administratorem w celu ustawienia kluczy API Google.
                </div>
            </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Zapisywanie..." : "Zapisz ustawienia"}
        </Button>
      </form>
    </Form>
  );
}
