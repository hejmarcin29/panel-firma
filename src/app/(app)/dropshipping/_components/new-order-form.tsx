"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DROPSHIPPING_CHANNEL_OPTIONS } from "@/lib/dropshipping/constants";
import { formatPln } from "@/lib/utils";

import { createDropshippingOrderAction } from "../actions";

const VAT_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "8%", value: "8" },
  { label: "23%", value: "23" },
];

interface NewDropshippingOrderFormProps {
  orderNumberHint: string;
}

interface DraftItem {
  id: string;
  title: string;
  packagesCount: string;
  areaM2: string;
  pricePerPackage: string;
  pricePerSquareMeter: string;
}

function createDraftItem(fixedId?: string): DraftItem {
  const generatedId = fixedId
    ? fixedId
    : typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `draft-${Math.random().toString(36).slice(2)}`;
  return {
    id: generatedId,
    title: "",
    packagesCount: "",
    areaM2: "",
    pricePerPackage: "",
    pricePerSquareMeter: "",
  };
}

function sanitizeDecimal(input: string) {
  if (!input) {
    return 0;
  }
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function sanitizeArea(input: string) {
  if (!input || input.trim().length === 0) {
    return null;
  }
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function sanitizeInt(input: string) {
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="rounded-2xl" disabled={pending}>
      {pending ? "Zapisuję…" : "Zapisz zamówienie"}
    </Button>
  );
}

export function NewDropshippingOrderForm({ orderNumberHint }: NewDropshippingOrderFormProps) {
  const [state, formAction] = useActionState(createDropshippingOrderAction, null);
  const [channelValue, setChannelValue] = useState("");
  const [vatValue, setVatValue] = useState("23");
  const [items, setItems] = useState<DraftItem[]>(() => [createDraftItem("initial-item")]);

  const sanitizedItems = useMemo(() => {
    return items.map((item) => {
      return {
        title: item.title.trim(),
        packagesCount: sanitizeInt(item.packagesCount),
        areaM2: sanitizeArea(item.areaM2),
        pricePerPackage: sanitizeDecimal(item.pricePerPackage),
        pricePerSquareMeter: sanitizeDecimal(item.pricePerSquareMeter),
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    const vat = Number.parseFloat(vatValue) || 0;
    let packages = 0;
    let area = 0;
    let net = 0;

    for (const item of sanitizedItems) {
      packages += item.packagesCount;
      area += item.areaM2 ?? 0;
      const rowNet = item.packagesCount * item.pricePerPackage + (item.areaM2 ?? 0) * item.pricePerSquareMeter;
      net += rowNet;
    }

    const netCents = Math.round(net * 100);
    const grossCents = Math.round(net * (1 + vat / 100) * 100);

    return {
      packages,
      area,
      netCents,
      grossCents,
    };
  }, [sanitizedItems, vatValue]);

  const handleItemChange = (id: string, key: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createDraftItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="channel" value={channelValue} />
      <input type="hidden" name="vatRate" value={vatValue} />
      <input type="hidden" name="items" value={JSON.stringify(sanitizedItems)} />

      {state?.error ? (
        <Card className="border-destructive/40 bg-destructive/5 text-destructive">
          <CardContent className="py-4 text-sm">{state.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-2">
            <Label htmlFor="clientName">Klient</Label>
            <Input
              id="clientName"
              name="clientName"
              placeholder="np. Jan Kowalski / Instalacja Poznań"
              required
              aria-invalid={state?.fieldErrors?.clientName ? "true" : "false"}
              aria-describedby={state?.fieldErrors?.clientName ? "clientName-error" : undefined}
            />
            {state?.fieldErrors?.clientName ? (
              <p id="clientName-error" className="text-sm text-destructive">
                {state.fieldErrors.clientName}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            Przewidywany numer: {orderNumberHint}
          </Badge>
        </div>

        <div className="grid gap-2">
          <Label>Kanał sprzedaży</Label>
          <Select value={channelValue} onValueChange={setChannelValue}>
            <SelectTrigger
              aria-invalid={state?.fieldErrors?.channel ? "true" : "false"}
              aria-describedby={state?.fieldErrors?.channel ? "channel-error" : undefined}
            >
              <SelectValue placeholder="Wybierz kanał" />
            </SelectTrigger>
            <SelectContent>
              {DROPSHIPPING_CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.fieldErrors?.channel ? (
            <p id="channel-error" className="text-sm text-destructive">
              {state.fieldErrors.channel}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="channelReference">Identyfikator w kanale</Label>
          <Input
            id="channelReference"
            name="channelReference"
            placeholder="np. #34521 / WP-123"
            aria-invalid={state?.fieldErrors?.channelReference ? "true" : "false"}
            aria-describedby={state?.fieldErrors?.channelReference ? "channelReference-error" : undefined}
          />
          {state?.fieldErrors?.channelReference ? (
            <p id="channelReference-error" className="text-sm text-destructive">
              {state.fieldErrors.channelReference}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label>Stawka VAT</Label>
          <Select value={vatValue} onValueChange={setVatValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold">Pozycje towarowe</h2>
            <p className="text-sm text-muted-foreground">
              Wprowadź każdy produkt lub zestaw oddzielnie – dzięki temu policzymy wartości netto automatycznie.
            </p>
          </div>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> Dodaj pozycję
          </Button>
        </div>

        {state?.fieldErrors?.items ? (
          <p className="text-sm text-destructive">{state.fieldErrors.items}</p>
        ) : null}

        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const titleId = `item-title-${item.id}`;
            const packagesId = `item-packages-${item.id}`;
            const areaId = `item-area-${item.id}`;
            const pricePackageId = `item-price-package-${item.id}`;
            const priceAreaId = `item-price-area-${item.id}`;

            const sanitized = sanitizedItems[index];
            const rowNetCents = Math.round(
              (sanitized.packagesCount * sanitized.pricePerPackage +
                (sanitized.areaM2 ?? 0) * sanitized.pricePerSquareMeter) *
                100,
            );

            return (
              <div key={item.id} className="rounded-3xl border border-muted/60 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                    Poz. {index + 1}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    aria-label="Usuń pozycję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor={titleId}>Nazwa pozycji</Label>
                    <Input
                      id={titleId}
                      value={item.title}
                      onChange={(event) => handleItemChange(item.id, "title", event.target.value)}
                      placeholder="np. Zestaw paneli 6 kW"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={packagesId}>Opakowania</Label>
                    <Input
                      id={packagesId}
                      type="number"
                      min={0}
                      value={item.packagesCount}
                      onChange={(event) => handleItemChange(item.id, "packagesCount", event.target.value)}
                      placeholder="np. 3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={areaId}>Powierzchnia (m²)</Label>
                    <Input
                      id={areaId}
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.areaM2}
                      onChange={(event) => handleItemChange(item.id, "areaM2", event.target.value)}
                      placeholder="opcjonalnie"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={pricePackageId}>Cena za opakowanie (zł)</Label>
                    <Input
                      id={pricePackageId}
                      inputMode="decimal"
                      value={item.pricePerPackage}
                      onChange={(event) => handleItemChange(item.id, "pricePerPackage", event.target.value)}
                      placeholder="np. 1200"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={priceAreaId}>Cena za m² (zł)</Label>
                    <Input
                      id={priceAreaId}
                      inputMode="decimal"
                      value={item.pricePerSquareMeter}
                      onChange={(event) => handleItemChange(item.id, "pricePerSquareMeter", event.target.value)}
                      placeholder="np. 150"
                    />
                  </div>
                  <div className="grid content-end gap-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Łącznie netto</span>
                    <span className="text-sm font-medium">{formatPln(rowNetCents)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="supplier">Dostawca</Label>
          <Input
            id="supplier"
            name="supplier"
            placeholder="np. Hurtownia PV / Własny magazyn"
            required
            aria-invalid={state?.fieldErrors?.supplier ? "true" : "false"}
            aria-describedby={state?.fieldErrors?.supplier ? "supplier-error" : undefined}
          />
          {state?.fieldErrors?.supplier ? (
            <p id="supplier-error" className="text-sm text-destructive">
              {state.fieldErrors.supplier}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notatki dla zespołu</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="np. Termin dostawy, specyficzne wymagania klienta"
            rows={3}
            aria-invalid={state?.fieldErrors?.notes ? "true" : "false"}
            aria-describedby={state?.fieldErrors?.notes ? "notes-error" : undefined}
          />
          {state?.fieldErrors?.notes ? (
            <p id="notes-error" className="text-sm text-destructive">
              {state.fieldErrors.notes}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold">Podsumowanie</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Opakowania</p>
            <p className="mt-2 text-lg font-semibold">{totals.packages}</p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Powierzchnia</p>
            <p className="mt-2 text-lg font-semibold">
              {totals.area > 0 ? `${totals.area.toFixed(2)} m²` : "Brak"}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Wartość netto</p>
            <p className="mt-2 text-lg font-semibold">{formatPln(totals.netCents)}</p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Wartość brutto</p>
            <p className="mt-2 text-lg font-semibold">{formatPln(totals.grossCents)}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
