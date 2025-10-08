import Link from "next/link";

import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, HardHat, Package, PackageSearch, Truck } from "lucide-react";

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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireSession } from "@/lib/auth";
import { getInstallationDeliveriesDashboardData } from "@/lib/installation-deliveries";

import { installationDeliveriesColumns } from "./columns";
import { InstallationDeliveriesTable } from "./installation-deliveries-table";

export const metadata = {
  title: "Dostawy pod montaż",
  description: "Monitoruj transport materiałów zsynchronizowany z harmonogramem montaży.",
};

const formatDate = (value: Date | null | undefined) =>
  value ? format(value, "dd MMM yyyy", { locale: pl }) : null;

export default async function InstallationDeliveriesPage() {
  await requireSession();
  const { snapshot, list } = await getInstallationDeliveriesDashboardData(60);

  const now = new Date();
  const futureDeliveries = list
    .filter((delivery) => delivery.scheduledDate && delivery.scheduledDate > now)
    .sort((a, b) => (a.scheduledDate!.getTime() - b.scheduledDate!.getTime()));

  const nextDelivery = futureDeliveries[0] ?? null;
  const deliveriesToday = list.filter(
    (delivery) => delivery.scheduledDate && isSameDay(delivery.scheduledDate, now),
  ).length;

  const stats = [
    {
      label: "Łącznie dostaw",
      value: snapshot.metrics.total,
      hint: "Wszystkie transporty powiązane z montażem",
    },
    {
      label: "Na etapie planowania",
      value: snapshot.metrics.scheduled,
      hint: "Przyjęte i oczekujące na wysyłkę",
    },
    {
      label: "W drodze",
      value: snapshot.metrics.shippingOrdered,
      hint: "Zlecono przewoźnika",
    },
    {
      label: "Czeka na fakturę końcową",
      value: snapshot.metrics.deliveredAwaitingFinal,
      hint: "Dostarczone, wymagają rozliczenia",
    },
    {
      label: "Zamknięte",
      value: snapshot.metrics.completed,
      hint: "Proces logistyczny zakończony",
    },
    {
      label: "Wymaga uwagi",
      value: snapshot.metrics.requiringAttention,
      hint: "Alerty administracyjne",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Dostawy pod montaż
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Kontroluj logistykę pod harmonogram ekip
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Ten moduł skupia wyłącznie dostawy powiązane z montaży. Monitoruj statusy, zsynchronizuj terminy i szybko reaguj na opóźnienia.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              <Link href="/montaze/nowa-dostawa">
                <Truck className="mr-2 size-4" aria-hidden />
                Dodaj dostawę pod montaż
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-full border-primary/50 px-5 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <Link href="/montaze">
                <HardHat className="mr-2 size-4" aria-hidden />
                Wróć do montaży
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {nextDelivery ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
                <CalendarDays className="size-3.5" aria-hidden />
                Najbliższa dostawa:
                <span className="font-semibold">
                  {formatDate(nextDelivery.scheduledDate) ?? "w trakcie ustalania"}
                </span>
                {nextDelivery.installationNumber ? (
                  <span className="text-primary/80">• Montaż #{nextDelivery.installationNumber}</span>
                ) : null}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <PackageSearch className="size-3.5" aria-hidden />
                Brak zaplanowanych dostaw – dodaj pierwszą.
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-muted/60 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <Truck className="size-3.5" aria-hidden />
              Dostawy dzisiaj: <span className="font-semibold text-foreground">{deliveriesToday}</span>
            </div>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
          <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-muted-foreground">Łącznie rekordów</span>
              <span className="text-2xl font-semibold text-foreground">{snapshot.metrics.total}</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-amber-500/10 shadow-lg shadow-amber-500/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-amber-900/80 dark:text-amber-100/80">Wymaga uwagi</span>
              <span className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                {snapshot.metrics.requiringAttention}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-3xl border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <Package className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Nadchodzące transporty</CardTitle>
            <CardDescription>Monitoruj najnowsze zlecenia logistyczne powiązane z montaży.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.recent.length ? (
              snapshot.recent.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">#{item.deliveryNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.clientName ?? 'Klient nieznany'}
                      {item.installationNumber ? ` • Montaż #${item.installationNumber}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <Badge variant="secondary" className="rounded-full bg-muted px-3 py-1 text-xs">
                      {item.stageLabel}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(item.scheduledDate) ?? 'Termin do ustalenia'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <Empty className="border border-dashed border-border/60 bg-muted/30">
                <EmptyMedia variant="icon">
                  <Package className="size-6" aria-hidden />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Brak transportów</EmptyTitle>
                  <EmptyDescription>Dodaj pierwszą dostawę pod montaż, aby zacząć śledzenie.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Szybkie wskaźniki</CardTitle>
            <CardDescription>Stan logistyki na teraz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="font-medium text-foreground">Dostawy dziś</span>
              <span className="text-base font-semibold text-foreground">{deliveriesToday}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="font-medium text-foreground">W drodze</span>
              <span className="text-base font-semibold text-foreground">{snapshot.metrics.shippingOrdered}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <span className="font-medium text-amber-600 dark:text-amber-200">Wymaga reakcji</span>
              <span className="text-base font-semibold text-amber-600 dark:text-amber-200">
                {snapshot.metrics.requiringAttention}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border border-border/60">
        <CardContent className="p-6">
          <InstallationDeliveriesTable columns={installationDeliveriesColumns} data={list} />
        </CardContent>
      </Card>
    </div>
  );
}
