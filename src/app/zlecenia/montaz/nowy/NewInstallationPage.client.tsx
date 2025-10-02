"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { DatePicker } from "@/components/ui/date-picker";

type Client = { id: string; name: string };
type Installer = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

const schema = z.object({
  clientId: z.string().uuid({ message: "Wybierz klienta" }),
  preMeasurementSqm: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v === "" || /^[0-9]+$/.test(v), { message: "Tylko liczby" }),
  note: z.string().max(2000),
  installerId: z.union([z.string().uuid(), z.literal("")]),
  scheduledDate: z.string().optional(),
  // Nowe pola (opcjonalne)
  proposedInstallPricePln: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v === "" || /^\d+(?:[\.,]\d{1,2})?$/.test(v), {
      message: "Nieprawidłowy format ceny",
    })
    .optional(),
  buildingType: z.enum(["house", "apartment"]).or(z.literal("")).optional(),
  desiredInstallFrom: z.string().optional(),
  desiredInstallTo: z.string().optional(),
  // Miejsce realizacji (opcjonalne; gdy puste użyjemy adresu z faktury)
  locationPostalCode: z.string().optional(),
  locationCity: z.string().optional(),
  locationAddress: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewInstallationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const sp = useSearchParams();
  const preselectedClientId = sp.get("clientId") || "";
  const [sameAsInvoice, setSameAsInvoice] = useState(true);
  const [invPostalCode, setInvPostalCode] = useState("");
  const [invCity, setInvCity] = useState("");
  const [invAddress, setInvAddress] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: preselectedClientId || "",
      preMeasurementSqm: "",
      note: "",
      installerId: "",
      scheduledDate: "",
      proposedInstallPricePln: "",
      buildingType: "",
      desiredInstallFrom: "",
      desiredInstallTo: "",
      locationPostalCode: "",
      locationCity: "",
      locationAddress: "",
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [c, u] = await Promise.all([
          fetch("/api/klienci").then((r) => r.json()),
          fetch("/api/uzytkownicy?role=installer")
            .then((r) => r.json())
            .catch(() => ({ users: [] })),
        ]);
        setClients(c.clients || []);
        setInstallers(
          (u.users || []).filter((x: Installer) => x.role === "installer"),
        );
      } catch {
        setLoadError("Błąd ładowania list");
      } finally {
        setLoadingLists(false);
      }
    })();
  }, []);

  // Load invoice address of selected client to preview in disabled fields
  useEffect(() => {
    const cid = preselectedClientId || watch("clientId");
    if (!cid) {
      setInvPostalCode("");
      setInvCity("");
      setInvAddress("");
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/klienci/${cid}`);
        type ClientResp = { client?: { invoicePostalCode?: string | null; invoiceCity?: string | null; invoiceAddress?: string | null } };
        const j = (await r.json().catch(() => null)) as ClientResp | null;
        if (r.ok && j?.client) {
          setInvPostalCode(j.client.invoicePostalCode || "");
          setInvCity(j.client.invoiceCity || "");
          setInvAddress(j.client.invoiceAddress || "");
        }
      } catch {
        // ignore
      }
    })();
    // We intentionally depend on raw value to re-fetch when client changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedClientId, watch("clientId")]);

  // Keep clientId in sync if preselected
  useEffect(() => {
    if (preselectedClientId) setValue("clientId", preselectedClientId);
  }, [preselectedClientId, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      const body: Record<string, unknown> = { clientId: values.clientId };
      if (values.preMeasurementSqm && values.preMeasurementSqm.trim() !== "")
        body.preMeasurementSqm = parseInt(values.preMeasurementSqm, 10);
      if (values.note && values.note.trim() !== "")
        body.note = values.note.trim();
      if (values.installerId && values.installerId !== "")
        body.installerId = values.installerId;
      if (values.scheduledDate && values.scheduledDate.trim() !== "") {
        const [y, m, d] = values.scheduledDate
          .split("-")
          .map((x) => parseInt(x, 10));
        body.scheduledDate = new Date(
          y,
          (m || 1) - 1,
          d || 1,
          0,
          0,
          0,
          0,
        ).getTime();
      }
  // Installation extras
      const priceStr = (values.proposedInstallPricePln || "").replace(",", ".");
      if (priceStr !== "") {
        const n = Number(priceStr);
        if (!Number.isNaN(n) && Number.isFinite(n)) {
          body.proposedInstallPriceCents = Math.round(n * 100);
        }
      }
      if (typeof values.buildingType === "string" && values.buildingType !== "") {
        body.buildingType = values.buildingType;
      }
      if (values.desiredInstallFrom && values.desiredInstallFrom.trim() !== "") {
        const [y, m, d] = values.desiredInstallFrom
          .split("-")
          .map((x) => parseInt(x, 10));
        body.desiredInstallFrom = new Date(
          y,
          (m || 1) - 1,
          d || 1,
          0,
          0,
          0,
          0,
        ).getTime();
      }
      if (values.desiredInstallTo && values.desiredInstallTo.trim() !== "") {
        const [y, m, d] = values.desiredInstallTo
          .split("-")
          .map((x) => parseInt(x, 10));
        body.desiredInstallTo = new Date(
          y,
          (m || 1) - 1,
          d || 1,
          0,
          0,
          0,
          0,
        ).getTime();
      }
      // Lokalizacja (opcjonalnie) – tylko gdy odznaczono checkbox "taki sam jak faktura"
      if (!sameAsInvoice) {
        if ((values.locationPostalCode || "").trim() !== "") body.locationPostalCode = values.locationPostalCode!.trim();
        if ((values.locationCity || "").trim() !== "") body.locationCity = values.locationCity!.trim();
        if ((values.locationAddress || "").trim() !== "") body.locationAddress = values.locationAddress!.trim();
      }
      const resp = await fetch("/api/zlecenia/montaz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await resp.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!resp.ok) throw new Error(data?.error || "Błąd");
      toast({ title: "Utworzono montaż", variant: "success" });
      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się utworzyć montażu";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    }
  };

  const clientId = watch("clientId");

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-3xl md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/" />
        <h1 className="text-2xl font-semibold">Dodaj montaż</h1>
      </div>
      {loadError && <div className="text-sm text-red-600">{loadError}</div>}
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {preselectedClientId ? (
          <div>
            <Label>Klient</Label>
            <div className="mt-1 h-9 w-full rounded-md border border-black/15 px-3 text-sm flex items-center dark:border-white/15">
              {clients.find((c) => c.id === preselectedClientId)?.name ||
                "Wybrany klient"}
            </div>
            {/* Pole ukryte nie jest wymagane, bo RHF ma setValue; zostawiamy tylko podgląd */}
          </div>
        ) : (
          <div>
            <Label htmlFor="client">Klient</Label>
            <select
              id="client"
              aria-invalid={!!errors.clientId}
              aria-describedby={errors.clientId ? "client-error" : undefined}
              {...register("clientId")}
              className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
            >
              <option value="">-- wybierz klienta --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p id="client-error" className="text-xs text-red-600 mt-1">
                {errors.clientId.message as string}
              </p>
            )}
          </div>
        )}
        <div>
          <Label htmlFor="note">Notatka Primepodloga</Label>
          <Textarea
            id="note"
            placeholder="Uwagi wewnętrzne..."
            className="mt-1"
            {...register("note")}
          />
          <p className="text-xs opacity-60 mt-1">
            Historia notatki będzie zapisywana automatycznie.
          </p>
        </div>
        <div>
          <Label htmlFor="scheduledDate">Planowana data montażu</Label>
          <div className="mt-1">
            <DatePicker
              value={watch("scheduledDate") || ""}
              onChange={(v) => setValue("scheduledDate", v)}
            />
          </div>
          <p className="text-xs opacity-60 mt-1">
            Opcjonalnie — bez godziny (dzień montażu).
          </p>
        </div>
        <div>
          <Label>Miejsce realizacji (adres)</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="sameAsInvoice"
              type="checkbox"
              className="h-4 w-4"
              checked={sameAsInvoice}
              onChange={(e) => setSameAsInvoice(e.currentTarget.checked)}
            />
            <label htmlFor="sameAsInvoice" className="text-sm opacity-70">
              Adres realizacji taki sam jak do faktury
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Kod (00-000)"
              inputMode="numeric"
              disabled={sameAsInvoice}
              className={sameAsInvoice ? "opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5" : undefined}
              {...register("locationPostalCode")}
              value={sameAsInvoice ? invPostalCode : watch("locationPostalCode")}
              onChange={(e) => {
                const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 5);
                const fm = digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`;
                setValue("locationPostalCode", fm);
              }}
            />
            <Input
              placeholder="Miejscowość"
              disabled={sameAsInvoice}
              className={sameAsInvoice ? "opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5" : undefined}
              {...register("locationCity")}
              value={sameAsInvoice ? invCity : watch("locationCity")}
            />
            <Input
              placeholder="Adres (ulica i numer, opcjonalnie lokal/piętro)"
              disabled={sameAsInvoice}
              className={sameAsInvoice ? "opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5" : undefined}
              {...register("locationAddress")}
              value={sameAsInvoice ? invAddress : watch("locationAddress")}
            />
          </div>
          <p className="text-[11px] opacity-60 mt-1">Zaznaczone = użyjemy adresu z faktury; pola są podglądowe i wyłączone.</p>
        </div>
        <div>
          <Label htmlFor="sqm">m2 przed pomiarem</Label>
          <Input
            id="sqm"
            className="mt-1 w-40"
            placeholder="np. 55"
            inputMode="numeric"
            {...register("preMeasurementSqm")}
          />
          {errors.preMeasurementSqm && (
            <p className="text-xs text-red-600 mt-1">
              {errors.preMeasurementSqm.message as string}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="installer">Przypisz montażystę</Label>
          <select
            id="installer"
            {...register("installerId")}
            className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
          >
            <option value="">-- bez przypisania --</option>
            {installers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Zaproponowana cena montażu (PLN)</Label>
          <Input
            placeholder="np. 1200,00"
            inputMode="decimal"
            className="mt-1 w-40"
            {...register("proposedInstallPricePln")}
          />
          {errors.proposedInstallPricePln && (
            <p className="text-xs text-red-600 mt-1">
              {errors.proposedInstallPricePln.message as string}
            </p>
          )}
        </div>
        <div>
          <Label>Dom czy blok?</Label>
          <select
            className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
            {...register("buildingType")}
          >
            <option value="">— nie wybrano —</option>
            <option value="house">Dom</option>
            <option value="apartment">Blok</option>
          </select>
        </div>
        <div>
          <Label>Kiedy chce montaż (przedział)</Label>
          <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <div className="text-xs opacity-70 mb-1">Od</div>
              <DatePicker
                value={watch("desiredInstallFrom") || ""}
                onChange={(v) => setValue("desiredInstallFrom", v)}
              />
            </div>
            <div>
              <div className="text-xs opacity-70 mb-1">Do</div>
              <DatePicker
                value={watch("desiredInstallTo") || ""}
                onChange={(v) => setValue("desiredInstallTo", v)}
              />
            </div>
          </div>
          <p className="text-xs opacity-60 mt-1">Oba pola opcjonalne; można podać tylko jedno.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !clientId || loadingLists}
            className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
          >
            Zapisz
          </button>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15"
          >
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}
