"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/back-button";
import { useToast } from "@/components/ui/toaster";
import { pl } from "@/i18n/pl";

const schema = z.object({
  name: z.string().min(1, "Imię i nazwisko jest wymagane"),
  phone: z.string().optional(),
  email: z.string().email("Podaj poprawny email").optional().or(z.literal("")),
  invoiceCity: z.string().optional(),
  invoicePostalCode: z.string().optional(),
  invoiceAddress: z.string().optional(),
  taxId: z.string().optional(),
  isCompany: z.boolean().default(false),
  companyName: z.string().optional(),
  note: z.string().optional(),
  source: z.string().optional(),
  // Usunięto wybór serviceType z formularza – decyzja: domyślnie 'with_installation' pozostaje w backendzie (lub zostanie zrefaktoryzowane później)
});

export default function NowyKlientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      invoiceCity: "",
      invoicePostalCode: "",
      invoiceAddress: "",
      taxId: "",
      companyName: "",
      isCompany: false,
      note: "",
      source: "",
    },
  });
  const isCompany = watch("isCompany");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
        <h1 className="text-2xl font-semibold">{pl.clients.new}</h1>
      </div>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (data) => {
          try {
            const payload: Record<string, unknown> = {
              name: data.name,
              phone: data.phone || "",
              email: data.email || "",
              invoiceCity: data.invoiceCity || "",
              invoicePostalCode: data.invoicePostalCode || "",
              invoiceAddress: data.invoiceAddress || "",
            };
            if (data.source) payload.source = data.source;
            if (data.isCompany) {
              if (data.taxId) payload.taxId = data.taxId;
              if (data.companyName) payload.companyName = data.companyName;
              // serviceType pomijamy – backend nada domyślność / zostanie uproszczone
            }
            const r = await fetch("/api/klienci", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok)
              throw new Error(
                (await r.json().catch(() => ({}))).error || "Błąd zapisu",
              );
            const { id } = await r.json();
            const note = (data.note || "").trim();
            if (note) {
              const rn = await fetch(`/api/klienci/${id}/notatki`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: note }),
              });
              if (!rn.ok) {
                toast({
                  title: pl.clients.notePartialFail,
                  variant: "destructive",
                });
              }
            }
            toast({ title: pl.clients.createSuccess, variant: "success" });
            router.push(`/klienci/${id}`);
          } catch (e: unknown) {
            const msg =
              e instanceof Error ? e.message : "Nie udało się zapisać";
            toast({
              title: pl.common.error,
              description: msg,
              variant: "destructive",
            });
          }
        })}
      >
        <div>
          <Label>{pl.clients.name}</Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{pl.clients.phone}</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label>{pl.clients.email}</Label>
            <Input type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>{pl.clients.invoiceCity}</Label>
            <Input
              {...register("invoiceCity")}
              onChange={(e) => {
                setValue("invoiceCity", e.target.value);
              }}
            />
          </div>
          <div>
            <Label>{pl.clients.invoiceAddress}</Label>
            <Input
              {...register("invoiceAddress")}
              onChange={(e) => {
                setValue("invoiceAddress", e.target.value);
              }}
            />
          </div>
          <div>
            <Label>Kod pocztowy</Label>
            <Input {...register("invoicePostalCode")} />
          </div>
        </div>

        <div>
          <Label>Źródło (skąd klient?)</Label>
          <Input
            {...register("source")}
            placeholder="np. Polecenie, Google, Facebook"
          />
        </div>

        <div className="flex items-center gap-2">
          <input id="isCompany" type="checkbox" {...register("isCompany")} />
          <label htmlFor="isCompany" className="text-sm">
            Na firmę
          </label>
        </div>
        {isCompany && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Nazwa firmy</Label>
              <Input {...register("companyName")} />
            </div>
            <div>
              <Label>NIP</Label>
              <Input {...register("taxId")} placeholder="np. 1234567890" />
            </div>
          </div>
        )}

        {/* Pole wyboru typu usługi usunięte – placeholder do ewentualnego powrotu */}

        <div>
          <Label>{pl.clients.notesTitle}</Label>
          <Textarea
            rows={4}
            placeholder="(opcjonalnie)"
            {...register("note")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {pl.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
