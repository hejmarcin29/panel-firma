"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { pl } from "@/i18n/pl";
import { AddressFields } from "@/components/address/address-fields.client";

const schema = z
  .object({
    name: z.string().min(1, "Imię i nazwisko jest wymagane"),
    phone: z.string().optional().or(z.literal("")),
    email: z
      .string()
      .email("Podaj poprawny email")
      .optional()
      .or(z.literal("")),
    invoiceCity: z.string().optional().or(z.literal("")),
    invoicePostalCode: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) =>
          typeof v !== "string" || v === "" || /^[0-9]{2}-[0-9]{3}$/.test(v),
        {
          message: "Kod pocztowy w formacie 00-000",
        },
      ),
    invoiceAddress: z.string().optional().or(z.literal("")),
    taxId: z.string().optional().or(z.literal("")),
    companyName: z.string().optional().or(z.literal("")),
    source: z.string().optional().or(z.literal("")),
    // buyerType=company będzie oznaczać preferencję faktury VAT (pole preferVatInvoice ustawimy automatycznie na true)
    preferVatInvoice: z.boolean().default(false).optional(),
    buyerType: z.enum(["person", "company"]).optional(),
    invoiceEmail: z
      .string()
      .email("Podaj poprawny email")
      .optional()
      .or(z.literal("")),
    eInvoiceConsent: z.boolean().default(false).optional(),
  })
  .superRefine((data, ctx) => {
    // NIP: 10 cyfr + checksum, tylko gdy: faktura VAT preferowana i nabywca = firma
    // Logika: jeżeli nabywca = firma (co implikuje fakturę VAT), weryfikujemy NIP i wymagamy nazwy firmy
    if (data.buyerType === "company") {
      const raw = (data.taxId || "").replace(/[^0-9]/g, "");
      if (raw.length !== 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxId"],
          message: "NIP musi mieć 10 cyfr",
        });
        return;
      }
      const digits = raw.split("").map((d) => parseInt(d, 10));
      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
      const check = sum % 11;
      if (check !== digits[9]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxId"],
          message: "Nieprawidłowy NIP (błędna suma kontrolna)",
        });
      }
      if (!data.companyName || data.companyName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["companyName"],
          message: "Nazwa firmy jest wymagana",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export default function EdytujKlientaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
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
      source: "",
      preferVatInvoice: false,
      buyerType: "person",
      invoiceEmail: "",
      eInvoiceConsent: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/klienci/${id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Błąd");
        reset({
          name: j.client.name || "",
          phone: j.client.phone || "",
          email: j.client.email || "",
          invoiceCity: j.client.invoiceCity || "",
          invoicePostalCode: j.client.invoicePostalCode || "",
          invoiceAddress: j.client.invoiceAddress || "",
          taxId: j.client.taxId || "",
          companyName: j.client.companyName || "",
          source: j.client.source || "",
          // preferVatInvoice będzie spójne z buyerType: gdy firma → true
          buyerType: j.client.buyerType === "company" ? "company" : "person",
          preferVatInvoice:
            j.client.buyerType === "company"
              ? true
              : Boolean(j.client.preferVatInvoice),
          invoiceEmail: j.client.invoiceEmail || "",
          eInvoiceConsent: Boolean(j.client.eInvoiceConsent),
        });
      } catch {
        setError("Błąd ładowania");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reset]);

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton fallbackHref={`/klienci/${id}`} />
        <h1 className="text-2xl font-semibold">{pl.clients.edit} klienta</h1>
      </div>
      {loading ? (
        <p>Wczytywanie…</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
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
                preferVatInvoice: !!data.preferVatInvoice,
                buyerType: data.buyerType || "person",
                invoiceEmail: data.invoiceEmail || "",
                eInvoiceConsent: !!data.eInvoiceConsent,
              };
              if (data.buyerType === "company") {
                payload.taxId = data.taxId || "";
                payload.companyName = data.companyName || "";
              } else {
                // jeżeli odznaczono 'Na firmę', wyczyść dane firmy
                payload.taxId = "";
                payload.companyName = "";
              }
              const r = await fetch(`/api/klienci/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!r.ok)
                throw new Error(
                  (await r.json().catch(() => ({}))).error || "Błąd zapisu",
                );
              toast({ title: pl.clients.updateSuccess, variant: "success" });
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
            <Input {...register("name")} aria-invalid={!!errors.name} />
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
          <AddressFields
            register={register}
            errors={errors}
            prefix="invoice"
            maskPostal
          />
          {/* Fakturowanie */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="buyer_person"
                  type="radio"
                  value="person"
                  {...register("buyerType", {
                    onChange: (e) => {
                      // przy wyborze osoby – preferVatInvoice = false
                      if (e.target.value === "person") {
                        (document.getElementById(
                          "preferVatInvoice_hidden",
                        ) as HTMLInputElement | null)!.value = "false";
                      }
                    },
                  })}
                />
                <Label htmlFor="buyer_person">Na osobę</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="buyer_company"
                  type="radio"
                  value="company"
                  {...register("buyerType", {
                    onChange: (e) => {
                      // przy wyborze firmy – preferVatInvoice = true (implikowane)
                      if (e.target.value === "company") {
                        (document.getElementById(
                          "preferVatInvoice_hidden",
                        ) as HTMLInputElement | null)!.value = "true";
                      }
                    },
                  })}
                />
                <Label htmlFor="buyer_company">
                  Na firmę (preferuje fakturę VAT)
                </Label>
              </div>
            </div>
            {/* hidden controlled input żeby payload wysłał spójny preferVatInvoice */}
            <input
              id="preferVatInvoice_hidden"
              type="hidden"
              {...register("preferVatInvoice")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>E‑mail do faktury</Label>
                <Input type="email" {...register("invoiceEmail")} />
                {errors.invoiceEmail && (
                  <p className="text-sm text-red-600">
                    {errors.invoiceEmail.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-6 sm:mt-0">
                <input
                  id="eInvoiceConsent"
                  type="checkbox"
                  className="h-4 w-4"
                  {...register("eInvoiceConsent")}
                />
                <Label htmlFor="eInvoiceConsent">Zgoda na e‑fakturę</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Źródło (skąd klient?)</Label>
            <Input
              {...register("source")}
              placeholder="np. Polecenie, Google, Facebook"
            />
          </div>
          {/* Pola firmy (gdy nabywca = firma) */}
          {watch("buyerType") === "company" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nazwa firmy</Label>
                <Input {...register("companyName")} />
              </div>
              <div>
                <Label>NIP</Label>
                <Input {...register("taxId")} />
              </div>
            </div>
          ) : null}
          {/* Pole Typ usługi usunięte */}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {pl.common.save}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
