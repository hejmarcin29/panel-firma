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
})
  .superRefine((data, ctx) => {
    if (data.isCompany) {
      if (!data.companyName || data.companyName.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["companyName"], message: "Nazwa firmy jest wymagana" });
      }
      const nip = (data.taxId || "").replace(/\s|-/g, "");
      if (!nip) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["taxId"], message: "NIP jest wymagany" });
      } else if (!/^\d{10}$/.test(nip)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["taxId"], message: "NIP powinien mieć 10 cyfr" });
      }
    }
  });

type FormValues = z.input<typeof schema>;

export default function NowyKlientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
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
    <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
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
              buyerType: data.isCompany ? "company" : "person",
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
          <Label>{isCompany ? "Imię i nazwisko osoby kontaktowej" : pl.clients.name}</Label>
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
            <Label>Kod pocztowy</Label>
            <Input {...register("invoicePostalCode")} />
          </div>
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
        </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Jeden email – brak osobnego pola do faktury */}

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
              <Input aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? "err-companyName" : undefined} {...register("companyName")} />
              {errors.companyName && (
                <p id="err-companyName" className="text-sm text-red-600">{errors.companyName.message as string}</p>
              )}
            </div>
            <div>
              <Label>NIP</Label>
              <Input aria-invalid={!!errors.taxId} aria-describedby={errors.taxId ? "err-taxId" : undefined} {...register("taxId")} placeholder="np. 1234567890" />
              {errors.taxId && (
                <p id="err-taxId" className="text-sm text-red-600">{errors.taxId.message as string}</p>
              )}
            </div>
          </div>
        )}

        </div>

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
