import Link from "next/link";

import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  AlertTriangle,
  HardHat,
  Package,
  PlusCircle,
  Route,
  Search,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import {
  deliveryStageBadgeClasses,
  getDeliveriesSnapshot,
} from "@/lib/deliveries";
import { cn } from "@/lib/utils";

type DostawyPageProps = {
  searchParams?: Promise<{
    delivery?: string;
  }>;
};

const formatDate = (value: Date | null | undefined, fallback = "Brak terminu") => {
  if (!value) {
    return fallback;
  }

  return format(value, "dd MMM yyyy", { locale: pl });
};

const formatRelativeDate = (value: Date | null | undefined) => {
  if (!value) {
    return "brak danych";
  }

  return formatDistanceToNow(value, { addSuffix: true, locale: pl });
};

export default async function DostawyPage({ searchParams }: DostawyPageProps) {
  await requireSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const highlightedDeliveryRaw = resolvedSearchParams?.delivery ?? "";
  const highlightedDelivery = highlightedDeliveryRaw.trim();

  const snapshot = await getDeliveriesSnapshot(20);
  const { metrics, recent, distribution } = snapshot;
  const hasDeliveries = metrics.total > 0;
  const latestEntries = recent.slice(0, 5);
  const latestDelivery = latestEntries[0] ?? null;
  const awaitingPaymentEntries = recent
    .filter((delivery) => delivery.stage === "PROFORMA_SENT_AWAITING_PAYMENT")
    .slice(0, 5);
  const shippingOrderedEntries = recent
    .filter((delivery) => delivery.stage === "SHIPPING_ORDERED")
    .slice(0, 5);
  const completedEntries = recent
    .filter((delivery) => delivery.stage === "COMPLETED")
    .slice(0, 5);

  const topCards = [
    {
      label: "Łącznie dostaw",
      value: metrics.total,
      hint: "Wszystkie rekordy trybu \"Tylko dostawa\"",
      accent: "bg-orange-500/10 text-orange-600",
    },
    {
      label: "Wymaga uwagi",
      value: metrics.requiringAttention,
      hint: "Flaga administratora",
      accent:
        metrics.requiringAttention > 0
          ? "bg-red-500/10 text-red-600"
          : "bg-muted/60 text-muted-foreground",
    },
  ] as const;

  const summaryCards = [
    {
      label: "W oczekiwaniu na płatność",
      hint: "Etap proformy",
      value: metrics.awaitingPayment,
      entries: awaitingPaymentEntries,
      emptyMessage: "Brak dostaw oczekujących na płatność.",
    },
    {
      label: "Transport zlecony",
      hint: "Etap logistyki",
      value: metrics.shippingOrdered,
      entries: shippingOrderedEntries,
      emptyMessage: "Brak dostaw ze zleconym transportem.",
    },
    {
      label: "Zakończone",
      hint: "Dostawy rozliczone",
      value: metrics.completed,
      entries: completedEntries,
      emptyMessage: "Brak zakończonych dostaw.",
    },
  ] as const;

  const distributionTotal = metrics.total || 1;
  const renderDeliveryList = (items: typeof recent, emptyMessage: string) => {
    if (!items.length) {
      return (
        <p className="text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      );
    }

    return (
      <ul className="space-y-2 text-sm">
        {items.map((delivery) => {
          const reference = delivery.deliveryNumber?.trim().length
            ? delivery.deliveryNumber
            : delivery.id.slice(0, 6).toUpperCase();
          const clientLabel = delivery.clientName ?? "Klient nieznany";
          const cityLabel = delivery.clientCity ?? "Brak danych";

          return (
            <li key={delivery.id}>
              <Link
                href={`/dostawy?delivery=${encodeURIComponent(reference)}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:border-orange-500/40 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                aria-label={`Zobacz dostawę ${reference}`}
              >
                <span className="font-semibold text-foreground">#{reference}</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">{clientLabel}</span>
                <span className="text-xs text-muted-foreground">{cityLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-orange-200/20 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Badge variant="outline" className="rounded-full border-orange-500/50 text-orange-600">
              Dostawy
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Kontroluj logistykę w trybie „Tylko dostawa”
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Monitoruj statusy wysyłek, reaguj na blokady i szybko przechodź do zleceń klientów. Wszystkie metryki
              pochodzą bezpośrednio z bazy danych.
            </p>
            {highlightedDelivery ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600">
                <Search className="size-3.5" aria-hidden />
                Wyróżnione: <span className="font-semibold">#{highlightedDelivery}</span>
                <span className="text-amber-600/80">– znajdź w tabeli poniżej.</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-full border-orange-500/50 text-orange-600">
              <Link href="/dostawy-pod-montaz">
                <HardHat className="mr-2 size-4" aria-hidden />
                Przejdź do dostaw pod montaż
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full bg-orange-500 px-4 font-semibold text-white shadow-lg shadow-orange-500/20"
            >
              <Link href="/dostawy/nowa">
                <PlusCircle className="mr-2 size-4" aria-hidden />
                Dodaj dostawę „Tylko dostawa”
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          {topCards.map((card) => (
            <Card key={card.label} className="rounded-2xl border-none bg-background/80 shadow-lg shadow-orange-500/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">{card.label}</span>
                <span className="text-2xl font-semibold text-foreground">{card.value}</span>
                <span className={cn("text-[11px] font-medium", card.accent)}>{card.hint}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="rounded-3xl border border-border/60">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <CardDescription>{card.hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
              {renderDeliveryList(card.entries, card.emptyMessage)}
            </CardContent>
          </Card>
        ))}
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ostatnio dodane</CardTitle>
            <CardDescription>
              {latestDelivery
                ? `Dodano ${formatRelativeDate(latestDelivery.createdAt)}`
                : "Brak zarejestrowanych dostaw w trybie „Tylko dostawa”."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderDeliveryList(latestEntries, "Brak rekordów do wyróżnienia. Dodaj dostawę „Tylko dostawa”, aby zobaczyć ją w tej sekcji.")}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-3xl border border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="size-5 text-orange-600" aria-hidden />
              Ostatnie dostawy w trybie „Tylko dostawa”
            </CardTitle>
            <CardDescription>Pełna lista wczytana bezpośrednio z bazy. Dodane rekordy pojawiają się natychmiast.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {hasDeliveries ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Numer dostawy</TableHead>
                      <TableHead>Klient</TableHead>
                      <TableHead>Miasto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Planowana data</TableHead>
                      <TableHead>Utworzono</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((delivery) => {
                      const reference = delivery.deliveryNumber?.trim().length
                        ? delivery.deliveryNumber
                        : delivery.id.slice(0, 6).toUpperCase();
                      const isHighlighted = highlightedDelivery
                        ? highlightedDelivery.toLowerCase() === reference.toLowerCase()
                        : false;
                      const stageBadge = deliveryStageBadgeClasses[delivery.stage] ?? "bg-muted text-foreground";

                      return (
                        <TableRow
                          key={delivery.id}
                          className={cn(
                            "group border-border/40 transition-colors hover:bg-muted/50",
                            isHighlighted && "border-orange-500/60 bg-orange-500/5 ring-1 ring-orange-500/30"
                          )}
                        >
                          <TableCell className="align-top font-semibold">
                            <div className="flex items-center gap-2">
                              <span>#{reference}</span>
                              {delivery.requiresAdminAttention ? (
                                <Badge variant="outline" className="inline-flex items-center gap-1 rounded-full border-red-500/60 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                  <AlertTriangle className="size-3" aria-hidden />
                                  Uwaga
                                </Badge>
                              ) : null}
                            </div>
                            {delivery.typeLabel ? (
                              <span className="text-[11px] text-muted-foreground">{delivery.typeLabel}</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">
                            {delivery.clientName ?? "Klient nieznany"}
                          </TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">
                            {delivery.clientCity ?? "Brak danych"}
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge className={cn("rounded-full px-3 py-1 text-xs", stageBadge)}>
                              {delivery.stageLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">
                            {formatDate(delivery.scheduledDate)}
                          </TableCell>
                          <TableCell className="align-top text-xs text-muted-foreground">
                            {formatRelativeDate(delivery.createdAt)}
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              {delivery.orderId ? (
                                <Button variant="outline" size="sm" asChild className="rounded-full border-border/60 text-xs">
                                  <Link href={`/zlecenia/${delivery.orderId}`}>
                                    Zobacz zlecenie
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <Empty className="border border-dashed border-border/60 bg-muted/40">
                  <EmptyMedia variant="icon">
                    <Package className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak dostaw „Tylko dostawa”</EmptyTitle>
                    <EmptyDescription>
                      Dodaj pierwszą dostawę, aby zobaczyć ją na liście i monitorować status w czasie rzeczywistym.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" asChild className="rounded-full bg-orange-500 px-4 font-semibold text-white">
                      <Link href="/dostawy/nowa">
                        <PlusCircle className="mr-2 size-4" aria-hidden />
                        Utwórz dostawę
                      </Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Etapy procesu dostawy</CardTitle>
            <CardDescription>Rozkład zadań według statusu logistycznego.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.map((item) => {
              const percent = Math.round((item.count / distributionTotal) * 100);
              return (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.count}</span>
                  </div>
                  <Progress value={percent} className="h-2" aria-label={`Udział etapu ${item.label}`} />
                  <span className="text-[11px] text-muted-foreground">{percent}% dostaw</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="size-5 text-orange-600" aria-hidden />
            Zsynchronizuj logistykę z montażem
          </CardTitle>
          <CardDescription>
            Łącz dostawy z harmonogramem ekip, aby mieć pełen przegląd przepływu materiałów.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>• Gdy dostawa wspiera montaż, dodaj ją z poziomu modułu montażowego, aby statusy były spójne.</p>
          <p>• Aktualizuj statusy po każdym kroku – panel automatycznie odświeży metryki i listę.</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-600">
            <Route className="size-3.5" aria-hidden />
            Potrzebujesz transportu pod brygadę? Przejdź do <Link href="/dostawy-pod-montaz" className="font-semibold underline-offset-4 hover:underline">dostaw pod montaż</Link>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
