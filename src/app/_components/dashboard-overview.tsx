"use client";

import Link from "next/link";
import { format, formatDistanceToNowStrict, isFuture } from "date-fns";
import { pl } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  HardHat,
  Package,
  Ruler,
  TrendingUp,
  Truck,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { orderStageLabels } from "@/lib/order-stage";
import type { OrdersMetrics, StageDistributionEntry } from "@/lib/orders";
import type { UsersMetrics } from "@/lib/users";

const numberFormatter = new Intl.NumberFormat("pl-PL");
const floorAreaFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

export type DashboardOverviewOrder = {
  id: string;
  orderNumber: string | null;
  title: string | null;
  clientName: string;
  clientCity: string | null;
  partnerName: string | null;
  executionMode: "INSTALLATION_ONLY" | "DELIVERY_ONLY";
  stage: StageDistributionEntry["stage"];
  stageNotes: string | null;
  stageChangedAt: string;
  requiresAdminAttention: boolean;
  pendingTasks: number;
  scheduledInstallationDate: string | null;
  createdAt: string;
};

export type DashboardOverviewInstallation = {
  id: string;
  installationNumber: string;
  status: string;
  statusLabel: string;
  orderId: string;
  orderReference: string;
  clientName: string | null;
  city: string | null;
  scheduledStartAt: string | null;
};

export type DashboardOverviewDelivery = {
  id: string;
  deliveryNumber: string;
  stage: string;
  stageLabel: string;
  type: string;
  typeLabel: string;
  requiresAdminAttention: boolean;
  orderId: string | null;
  clientName: string | null;
  clientCity: string | null;
  scheduledDate: string | null;
  createdAt: string;
};

export type DashboardOverviewClient = {
  id: string;
  clientNumber: number;
  fullName: string;
  city: string | null;
  partnerName: string | null;
  totalOrders: number;
  openOrders: number;
  lastOrderAt: string | null;
  createdAt: string;
};

type InstallationSummaryWithDates = DashboardOverviewInstallation & {
  scheduledStartAtDate: Date | null;
};

type DeliverySummaryWithDates = DashboardOverviewDelivery & {
  scheduledDateValue: Date | null;
  createdAtDate: Date;
};

type ClientHighlightWithDates = DashboardOverviewClient & {
  createdAtDate: Date;
  lastOrderAtDate: Date | null;
};

const installationStatusBadgeClasses: Record<string, string> = {
  PLANNED: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  IN_PROGRESS: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  COMPLETED: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-100",
  ON_HOLD: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-200",
} as const;

const deliveryStageBadgeClasses: Record<string, string> = {
  RECEIVED: "bg-muted text-foreground",
  PROFORMA_SENT_AWAITING_PAYMENT: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  SHIPPING_ORDERED: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  DELIVERED_AWAITING_FINAL_INVOICE: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
  COMPLETED: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
} as const;

const executionModeLabels = {
  INSTALLATION_ONLY: "Montaż + logistyka",
  DELIVERY_ONLY: "Tylko dostawa",
} as const;

const executionModeBadgeClasses: Record<keyof typeof executionModeLabels, string> = {
  INSTALLATION_ONLY: "border border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  DELIVERY_ONLY: "border border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

export type DashboardOverviewProps = {
  metrics: OrdersMetrics;
  stageDistribution: StageDistributionEntry[];
  usersMetrics: UsersMetrics;
  orders: DashboardOverviewOrder[];
  installations: {
    metrics: {
      total: number;
      scheduled: number;
      inProgress: number;
      completed: number;
      requiringAttention: number;
    };
    distribution: Array<{
      stage: StageDistributionEntry["stage"];
      label: string;
      count: number;
    }>;
    recent: DashboardOverviewInstallation[];
  };
  deliveries: {
    metrics: {
      total: number;
      awaitingPayment: number;
      shippingOrdered: number;
      completed: number;
      requiringAttention: number;
    };
    distribution: Array<{
      stage: string;
      label: string;
      count: number;
    }>;
    recent: DashboardOverviewDelivery[];
  };
  clients: {
    metrics: {
      totalClients: number;
      clientsWithOpenOrders: number;
      newThisMonth: number;
    };
    clients: DashboardOverviewClient[];
  };
  generatedAt: string;
};

export function DashboardOverview({
  metrics,
  stageDistribution,
  usersMetrics,
  orders,
  installations,
  deliveries,
  clients,
  generatedAt,
}: DashboardOverviewProps) {
  const totalOrders = metrics.totalOrders ?? 0;
  const completedOrders = stageDistribution.find((bucket) => bucket.stage === "COMPLETED")?.count ?? 0;
  const inProgress = Math.max(totalOrders - completedOrders, 0);
  const attentionRatio = totalOrders > 0 ? Math.round((metrics.requiringAttention / totalOrders) * 100) : 0;
  const updatedAtLabel = format(new Date(generatedAt), "d MMMM yyyy, HH:mm", { locale: pl });

  const stageDistributionChartData = stageDistribution.map((bucket) => ({
    stageLabel: orderStageLabels[bucket.stage],
    value: bucket.count,
  }));

  const highlightStage = stageDistribution
    .slice()
    .sort((a, b) => b.count - a.count)[0];

  const attentionOrders = orders.filter((order) => order.requiresAdminAttention).slice(0, 5);
  const upcomingInstallations = orders
    .filter((order) => order.scheduledInstallationDate && isFuture(new Date(order.scheduledInstallationDate)))
    .slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  const installationSummaries = installations.recent.map((item) => ({
    ...item,
    scheduledStartAtDate: item.scheduledStartAt ? new Date(item.scheduledStartAt) : null,
  })) as InstallationSummaryWithDates[];

  const deliverySummaries = deliveries.recent.map((item) => ({
    ...item,
    scheduledDateValue: item.scheduledDate ? new Date(item.scheduledDate) : null,
    createdAtDate: new Date(item.createdAt),
  })) as DeliverySummaryWithDates[];

  const clientHighlights = clients.clients.map((client) => ({
    ...client,
    createdAtDate: new Date(client.createdAt),
    lastOrderAtDate: client.lastOrderAt ? new Date(client.lastOrderAt) : null,
  })) as ClientHighlightWithDates[];

  const openClientsRatio = clients.metrics.totalClients > 0
    ? Math.round((clients.metrics.clientsWithOpenOrders / clients.metrics.totalClients) * 100)
    : 0;
  const newClientsRatio = clients.metrics.totalClients > 0
    ? Math.round((clients.metrics.newThisMonth / clients.metrics.totalClients) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-lg shadow-primary/10 xl:grid-cols-[1.6fr_1fr] xl:p-10">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit rounded-full border-primary/50 bg-primary/5 text-primary">
              Panel główny
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Centrum dowodzenia operacjami
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Monitoruj pipeline zleceń, postęp montaży i aktywność zespołów. Dashboard korzysta wyłącznie z danych z bazy,
                dlatego każde odchylenie natychmiast zobaczysz w metrykach.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Badge variant="secondary" className="gap-1 rounded-full bg-white/70 text-foreground shadow-sm dark:bg-zinc-800/70">
                <CalendarClock className="size-3" aria-hidden />
                Aktualizacja: {updatedAtLabel}
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200">
                <TrendingUp className="size-3" aria-hidden />
                Alerty: {metrics.requiringAttention}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/zlecenia">
                <ClipboardList className="mr-2 size-4" aria-hidden />
                Dodaj zlecenie
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full px-5">
              <Link href="/zlecenia">
                <CalendarDays className="mr-2 size-4" aria-hidden />
                Przeglądaj kalendarz montaży
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-3xl border-none bg-background/80 shadow-xl shadow-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                Zlecenia w toku
              </CardDescription>
              <CardTitle className="text-3xl font-semibold text-foreground">{numberFormatter.format(inProgress)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="size-4" aria-hidden />
                {attentionRatio}% wymagają uwagi
              </div>
              {highlightStage ? (
                <p>
                  Największy wolumen: <span className="font-medium text-foreground">{orderStageLabels[highlightStage.stage]}</span>
                </p>
              ) : (
                <p>Dodaj pierwsze zlecenie, aby rozpocząć monitoring.</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none bg-background/70 shadow-xl shadow-emerald-200/20">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                Aktywni użytkownicy (30 dni)
              </CardDescription>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {numberFormatter.format(usersMetrics.activeThisMonth ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Administracja: <span className="font-medium text-foreground">{usersMetrics.admins}</span>, Monterzy: {usersMetrics.installers}, Partnerzy: {usersMetrics.partners}
              </p>
              <p>Wartości prezentują realne logowania z ostatniego miesiąca.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Nowe zlecenia (7 dni)"
          value={metrics.newThisWeek}
          icon={ClipboardList}
          description="Utworzone w ciągu ostatnich 7 dni."
        />
        <KpiCard
          title="Zaplanowane montaże"
          value={installations.metrics.scheduled}
          icon={HardHat}
          description="Status „Zaplanowany” z aktywną datą rozpoczęcia."
          tone="emerald"
        />
        <KpiCard
          title="Powierzchnia w pipeline"
          value={metrics.totalDeclaredFloorArea}
          suffix="m²"
          icon={Ruler}
          description="Suma deklarowanych metrów kwadratowych."
          formatValue={(val) => floorAreaFormatter.format(val)}
        />
        <KpiCard
          title="Alerty operacyjne"
          value={metrics.requiringAttention}
          icon={AlertTriangle}
          description="Zlecenia oznaczone flagą requires_admin_attention."
          tone="amber"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Montaże w realizacji"
          value={installations.metrics.inProgress}
          icon={CalendarDays}
          description="Brygady z aktywnym statusem „W realizacji”."
          tone="primary"
        />
        <KpiCard
          title="Montaże wymagają reakcji"
          value={installations.metrics.requiringAttention}
          icon={AlertTriangle}
          description="Flaga administracyjna przy montażu."
          tone="amber"
        />
        <KpiCard
          title="Dostawy w drodze"
          value={deliveries.metrics.shippingOrdered}
          icon={Truck}
          description="Status „Zlecono wysyłkę” w trybie dostawy."
        />
        <KpiCard
          title="Dostawy oczekują na płatność"
          value={deliveries.metrics.awaitingPayment}
          icon={Package}
          description="Etap proformy wymagający zaksięgowania."
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">Rozkład etapów</CardTitle>
              <CardDescription>Liczba zleceń na każdym etapie procesu.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/5 text-primary">
              Łącznie: {totalOrders}
            </Badge>
          </CardHeader>
          <CardContent>
            {totalOrders === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak danych do wizualizacji. Dodaj pierwsze zlecenie, aby zobaczyć rozkład etapów.
              </p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <ChartContainer
                  config={{ value: { label: "Liczba zleceń", color: "hsl(var(--chart-1))" } }}
                  className="h-[280px]"
                >
                  <SimpleBarChart data={stageDistributionChartData} />
                </ChartContainer>
                <div className="space-y-4">
                  {stageDistribution.map((bucket) => {
                    const percentage = totalOrders > 0 ? Math.round((bucket.count / totalOrders) * 100) : 0;
                    return (
                      <div key={bucket.stage} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{orderStageLabels[bucket.stage]}</span>
                          <span className="text-muted-foreground">{bucket.count} · {percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Aktywność użytkowników</CardTitle>
            <CardDescription>Podsumowanie ról aktywnych w ciągu 30 dni.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Administratorzy" value={usersMetrics.admins} />
            <MetricRow label="Monterzy" value={usersMetrics.installers} />
            <MetricRow label="Partnerzy" value={usersMetrics.partners} />
            <MetricRow label="Łącznie" value={(usersMetrics.admins ?? 0) + (usersMetrics.installers ?? 0) + (usersMetrics.partners ?? 0)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1.4fr]">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Montaże – skrót operacyjny</CardTitle>
            <CardDescription>Podgląd harmonogramu brygad i ostatnich rekordów.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickStat label="Łącznie" value={installations.metrics.total} hint="Aktywne rekordy modułu montaży." />
              <QuickStat label="Zaplanowane" value={installations.metrics.scheduled} hint="Daty z kalendarza ekip." />
              <QuickStat label="W realizacji" value={installations.metrics.inProgress} hint="Status „W realizacji”." />
              <QuickStat label="Alerty" value={installations.metrics.requiringAttention} hint="Flaga administratora." />
            </div>
            <div className="space-y-3">
              {installationSummaries.length ? (
                installationSummaries.map((installation) => (
                  <InstallationSummaryRow key={installation.id} installation={installation} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Brak zaplanowanych montaży. Przejdź do modułu <Link href="/montaze" className="font-medium text-emerald-600 underline-offset-4 hover:underline">Montaże</Link>, aby dodać pierwszy harmonogram.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Dostawy – status logistyczny</CardTitle>
            <CardDescription>Najważniejsze etapy i ostatnie zgłoszenia „Tylko dostawa”.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickStat label="Łącznie" value={deliveries.metrics.total} hint="Tryb „Tylko dostawa”." />
              <QuickStat label="W transporcie" value={deliveries.metrics.shippingOrdered} hint="Status „Zlecono wysyłkę”." />
              <QuickStat label="Oczekują na płatność" value={deliveries.metrics.awaitingPayment} hint="Trwa potwierdzanie proformy." />
              <QuickStat label="Alerty" value={deliveries.metrics.requiringAttention} hint="Wpisy wymagające reakcji." />
            </div>
            <div className="space-y-3">
              {deliverySummaries.length ? (
                deliverySummaries.map((delivery) => (
                  <DeliverySummaryRow key={delivery.id} delivery={delivery} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nie dodano jeszcze dostaw w trybie stand-alone. Użyj przycisku „Dodaj dostawę” w module logistycznym.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Zlecenia wymagające reakcji</CardTitle>
            <CardDescription>Filtrujemy po polu requires_admin_attention = true.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attentionOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zleceń oznaczonych jako wymagające interwencji.</p>
            ) : (
              attentionOrders.map((order) => (
                <DashboardOrderRow key={order.id} order={order} showTasks />
              ))
            )
            }
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Nadchodzące montaże</CardTitle>
            <CardDescription>Lista zleceń z przyszłą datą montażu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingInstallations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak potwierdzonych montaży w kalendarzu.</p>
            ) : (
              upcomingInstallations.map((order) => (
                <DashboardOrderRow key={order.id} order={order} />
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Ostatnie zlecenia</CardTitle>
            <CardDescription>Sortujemy po dacie ostatniej zmiany etapu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zleceń w systemie. Dodaj nowe, aby rozpocząć raportowanie.</p>
            ) : (
              recentOrders.map((order) => (
                <DashboardOrderRow key={order.id} order={order} compact />
              ))
            )}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Aktywni klienci</CardTitle>
            <CardDescription>Nowe relacje i klienci z otwartymi zleceniami.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickStat label="Łącznie" value={clients.metrics.totalClients} hint={`${openClientsRatio}% z aktywnymi zleceniami.`} />
              <QuickStat label="Otwarty pipeline" value={clients.metrics.clientsWithOpenOrders} hint="Przynajmniej jedno zlecenie w toku." />
              <QuickStat label="Nowi w tym miesiącu" value={clients.metrics.newThisMonth} hint={`${newClientsRatio}% bazy klientów.`} />
            </div>
            <div className="space-y-3">
              {clientHighlights.length ? (
                clientHighlights.map((client) => (
                  <ClientHighlightRow key={client.id} client={client} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dodaj pierwszego klienta, aby monitorować pipeline sprzedażowy.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value?: number | null;
  suffix?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  tone?: "primary" | "emerald" | "amber" | "muted";
  formatValue?: (value: number) => string;
};

function KpiCard({ title, value, suffix, icon: Icon, description, tone = "primary", formatValue }: KpiCardProps) {
  const displayValue = value ?? 0;
  const toneClassMap: Record<NonNullable<KpiCardProps["tone"]>, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-200",
    muted: "bg-muted text-muted-foreground",
  };
  const formattedValue = formatValue ? formatValue(displayValue) : numberFormatter.format(displayValue);

  return (
    <Card className="flex flex-col justify-between rounded-3xl border border-border/60 bg-background/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">{title}</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-2xl font-semibold text-foreground">
            {formattedValue}
            {suffix ? <span className="text-sm font-normal text-muted-foreground">{suffix}</span> : null}
          </CardTitle>
        </div>
        <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${toneClassMap[tone]}`}>
          <Icon className="size-5" aria-hidden />
        </span>
      </CardHeader>
      {description ? <CardContent className="pt-0 text-sm text-muted-foreground">{description}</CardContent> : null}
    </Card>
  );
}

type MetricRowProps = {
  label: string;
  value: number | null | undefined;
};

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{numberFormatter.format(value ?? 0)}</span>
    </div>
  );
}

type QuickStatProps = {
  label: string;
  value: number | string;
  hint?: string;
};

function QuickStat({ label, value, hint }: QuickStatProps) {
  const formatted = typeof value === "number" ? numberFormatter.format(value) : value;

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold text-foreground">{formatted}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

type DashboardOrderRowProps = {
  order: DashboardOverviewOrder;
  compact?: boolean;
  showTasks?: boolean;
};

function DashboardOrderRow({ order, compact, showTasks }: DashboardOrderRowProps) {
  const stageChangedDate = new Date(order.stageChangedAt);
  const installationDate = order.scheduledInstallationDate ? new Date(order.scheduledInstallationDate) : null;

  const title = order.title ?? order.orderNumber ?? "Zlecenie bez nazwy";
  const cityLabel = order.clientCity ? `· ${order.clientCity}` : "";
  const partnerLabel = order.partnerName ? `Partner: ${order.partnerName}` : null;
  const executionLabel = executionModeLabels[order.executionMode];
  const executionBadgeClass = executionModeBadgeClasses[order.executionMode] ?? "border border-border/60 bg-muted text-muted-foreground";

  return (
    <Link
      href={`/zlecenia/${order.id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground group-hover:text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">
            {order.clientName} {cityLabel}
          </p>
          {partnerLabel ? <p className="text-xs text-muted-foreground">{partnerLabel}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:gap-2">
          <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${executionBadgeClass}`}>{executionLabel}</Badge>
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
            {orderStageLabels[order.stage]}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Ostatnia zmiana: {formatDistanceToNowStrict(stageChangedDate, { locale: pl, addSuffix: true })}</span>
        {installationDate ? (
          <span>
            Montaż: {format(installationDate, "d MMM yyyy", { locale: pl })}
            {isFuture(installationDate) ? " (planowane)" : " (zrealizowane)"}
          </span>
        ) : null}
        {showTasks ? <span>Zadania w toku: {order.pendingTasks}</span> : null}
      </div>
      {!compact && order.stageNotes ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{order.stageNotes}</p>
      ) : null}
    </Link>
  );
}

type InstallationSummaryRowProps = {
  installation: InstallationSummaryWithDates;
};

function InstallationSummaryRow({ installation }: InstallationSummaryRowProps) {
  const scheduledLabel = installation.scheduledStartAtDate
    ? format(installation.scheduledStartAtDate, "d MMM yyyy", { locale: pl })
    : "Termin do ustalenia";
  const clientLabel = installation.clientName ?? "Klient nieznany";
  const cityLabel = installation.city ? ` • ${installation.city}` : "";
  const badgeClass = installationStatusBadgeClasses[installation.status] ?? "bg-muted text-foreground";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">#{installation.installationNumber}</p>
        <p className="text-xs text-muted-foreground">
          {clientLabel}
          {cityLabel}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
        <Badge className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>{installation.statusLabel}</Badge>
        <span>Start: {scheduledLabel}</span>
        <Link
          href={`/zlecenia/${installation.orderId}`}
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Zobacz {installation.orderReference}
        </Link>
      </div>
    </div>
  );
}

type DeliverySummaryRowProps = {
  delivery: DeliverySummaryWithDates;
};

function DeliverySummaryRow({ delivery }: DeliverySummaryRowProps) {
  const badgeClass = deliveryStageBadgeClasses[delivery.stage] ?? "bg-muted text-foreground";
  const scheduledLabel = delivery.scheduledDateValue
    ? format(delivery.scheduledDateValue, "d MMM yyyy", { locale: pl })
    : "Termin w planowaniu";
  const createdLabel = formatDistanceToNowStrict(delivery.createdAtDate, { locale: pl, addSuffix: true });
  const clientLabel = delivery.clientName ?? "Klient nieznany";
  const cityLabel = delivery.clientCity ? ` • ${delivery.clientCity}` : "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">#{delivery.deliveryNumber}</p>
          {delivery.requiresAdminAttention ? (
            <Badge variant="outline" className="rounded-full border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200">
              Uwaga
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {clientLabel}
          {cityLabel}
        </p>
        <p className="text-[11px] text-muted-foreground">Typ: {delivery.typeLabel}</p>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
        <Badge className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>{delivery.stageLabel}</Badge>
        <span>Plan: {scheduledLabel}</span>
        <span>Dodano {createdLabel}</span>
        {delivery.orderId ? (
          <Link
            href={`/zlecenia/${delivery.orderId}`}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Powiązane zlecenie
          </Link>
        ) : null}
      </div>
    </div>
  );
}

type ClientHighlightRowProps = {
  client: ClientHighlightWithDates;
};

function ClientHighlightRow({ client }: ClientHighlightRowProps) {
  const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
  const isNew = Date.now() - client.createdAtDate.getTime() < THIRTY_DAYS_MS;
  const lastOrderLabel = client.lastOrderAtDate
    ? formatDistanceToNowStrict(client.lastOrderAtDate, { locale: pl, addSuffix: true })
    : "Brak zleceń";
  const locationLabel = client.city ?? "Brak miasta";
  const partnerLabel = client.partnerName ? `Partner: ${client.partnerName}` : null;
  const activeLabel = `${numberFormatter.format(client.openOrders)} otw. / ${numberFormatter.format(client.totalOrders)} łącznie`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">#{client.clientNumber} · {client.fullName}</p>
          {isNew ? (
            <Badge variant="outline" className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
              Nowy
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{locationLabel}</p>
        {partnerLabel ? <p className="text-[11px] text-muted-foreground">{partnerLabel}</p> : null}
      </div>
      <div className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
        <span className="text-sm font-semibold text-foreground">{activeLabel}</span>
        <span>Ostatnia aktywność: {lastOrderLabel}</span>
        <Link href={`/klienci/${client.id}`} className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
          Profil klienta
        </Link>
      </div>
    </div>
  );
}

type SimpleBarChartProps = {
  data: { stageLabel: string; value: number }[];
};

function SimpleBarChart({ data }: SimpleBarChartProps) {
  if (!data.length) {
    return null;
  }

  const maxValue = Math.max(1, ...data.map((item) => item.value ?? 0));

  return (
    <svg viewBox={`0 0 ${data.length * 40} 200`} className="h-full w-full">
      {data.map((entry, index) => {
        const barHeight = (entry.value / maxValue) * 180;
        const x = index * 40 + 10;
        const y = 190 - barHeight;
        return (
          <g key={entry.stageLabel}>
            <rect
              x={x}
              y={y}
              width={20}
              height={barHeight}
              rx={6}
              fill="var(--color-value)"
              opacity={0.9}
            />
            <text x={x + 10} y={196} textAnchor="middle" className="fill-current text-[10px]" opacity={0.7}>
              {entry.stageLabel.replace(/ .*/, "")}
            </text>
            <text x={x + 10} y={y - 6} textAnchor="middle" className="fill-current text-[11px] font-medium">
              {entry.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
