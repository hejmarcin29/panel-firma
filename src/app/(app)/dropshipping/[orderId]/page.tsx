import { CalendarClock, ClipboardCheck, Package, ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDropshippingOrderDetails } from "@/lib/dropshipping";
import {
  DROPSHIPPING_STAGE_LABELS,
  DROPSHIPPING_STAGE_OPTIONS,
  DROPSHIPPING_CHANNEL_OPTIONS,
} from "@/lib/dropshipping/constants";
import { formatPln } from "@/lib/utils";

import { Checklist } from "../_components/checklist";
import { StageSelect } from "../_components/stage-select";

function toDate(value: Date | number | null | undefined) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

const formatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const channelLabels = Object.fromEntries(
  DROPSHIPPING_CHANNEL_OPTIONS.map(({ value, label }) => [value, label]),
);

type OrderDetails = NonNullable<Awaited<ReturnType<typeof getDropshippingOrderDetails>>>;

function getStageDate(stage: string, order: OrderDetails) {
  switch (stage) {
    case "LEAD":
      return toDate(order.createdAt);
    case "PROFORMA_WYSLANA":
      return toDate(order.proformaIssuedAt);
    case "ZALICZKA_OPLACONA":
      return toDate(order.depositPaidAt);
    case "ZAMOWIENIE_DO_DOSTAWCY":
      return toDate(order.supplierOrderAt);
    case "DOSTAWA_POTWIERDZONA":
      return toDate(order.deliveryConfirmedAt);
    case "FAKTURA_KONCOWA":
      return toDate(order.finalInvoiceAt);
    default:
      return null;
  }
}

export default async function DropshippingOrderDetailsPage({
  params,
}: {
  params: { orderId: string };
}) {
  const orderId = Number(params.orderId);
  if (Number.isNaN(orderId)) {
    notFound();
  }

  const order = await getDropshippingOrderDetails(orderId);
  if (!order) {
    notFound();
  }

  const currentStageIndex = Math.max(
    DROPSHIPPING_STAGE_OPTIONS.findIndex((stage) => stage.value === order.status),
    0,
  );
  const channelLabel = channelLabels[order.channel] ?? order.channel;
  const grossValueLabel = formatPln(order.grossValue);
  const netValueLabel = formatPln(order.netValue);

  const checklistItems = order.checklist.map((item) => ({
    ...item,
    description: item.description ?? null,
    completedAt: toDate(item.completedAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Zamówienie</p>
          <h1 className="text-3xl font-semibold">{order.orderNumber}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              Utworzone {order.createdAt ? formatter.format(toDate(order.createdAt)!) : "brak danych"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>Kanał: {channelLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
            {DROPSHIPPING_STAGE_LABELS[order.status] ?? order.status}
          </Badge>
          <StageSelect orderId={order.id} currentStage={order.status} />
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link href="/dropshipping">Wróć do listy</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ReceiptText className="h-4 w-4" /> Szczegóły zamówienia
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm">
            <div className="grid gap-2">
              <span className="text-muted-foreground">Klient</span>
              <span className="text-base font-medium">{order.clientName}</span>
            </div>
            <div className="grid gap-1 text-xs text-muted-foreground">
              <span>Identyfikator w kanale</span>
              <span className="text-sm font-medium text-foreground">
                {order.channelReference ?? "Brak"}
              </span>
            </div>
            <div className="grid gap-2">
              <span className="text-muted-foreground">Opis towarów</span>
              <div className="whitespace-pre-wrap rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed">
                {order.goodsDescription ?? "Brak opisu"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-2xl bg-muted/30 p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Wartość netto</span>
                <span className="text-lg font-semibold">{netValueLabel}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl bg-muted/30 p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Wartość brutto</span>
                <span className="text-lg font-semibold">{grossValueLabel}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl bg-muted/30 p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Stawka VAT</span>
                <span className="text-lg font-semibold">{Math.round((order.vatRate ?? 0) * 100)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-dashed p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Liczba opakowań</span>
                <p className="mt-2 text-base font-medium">{order.packagesCount}</p>
              </div>
              <div className="rounded-2xl border border-dashed p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Powierzchnia</span>
                <p className="mt-2 text-base font-medium">
                  {order.areaM2 != null ? `${order.areaM2.toFixed(2)} m²` : "Brak danych"}
                </p>
              </div>
              <div className="rounded-2xl border border-dashed p-4">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Dostawca</span>
                <p className="mt-2 text-base font-medium">{order.supplier ?? "Brak danych"}</p>
              </div>
            </div>
            {order.notes ? (
              <div className="grid gap-2">
                <span className="text-muted-foreground">Notatki</span>
                <div className="whitespace-pre-wrap rounded-2xl bg-muted/20 p-4 text-sm leading-relaxed">
                  {order.notes}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="h-4 w-4" /> Oś czasu
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {DROPSHIPPING_STAGE_OPTIONS.map((stage, index) => {
              const date = getStageDate(stage.value, order);
              const isCompleted = index <= currentStageIndex;
              return (
                <div key={stage.value} className="flex items-start gap-3">
                  <div
                    className={"mt-1 h-2.5 w-2.5 rounded-full " + (isCompleted ? "bg-emerald-500" : "bg-muted-foreground/40")}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {date ? formatter.format(date) : "Brak daty"}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardCheck className="h-4 w-4" /> Checklista realizacji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Checklist orderId={order.id} items={checklistItems} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4" /> Podsumowanie wysyłki
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Integracja wysyłek będzie podłączona na etapie implementacji modułu kurierskiego.</p>
            <p>Na razie ds dokumentów i tracking uzupełniamy ręcznie według checklisty.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
