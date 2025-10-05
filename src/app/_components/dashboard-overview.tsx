"use client";

import Link from "next/link";
import { format, formatDistanceToNowStrict, isFuture } from "date-fns";
import { pl } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Ruler,
  TrendingUp,
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
  stage: StageDistributionEntry["stage"];
  stageNotes: string | null;
  stageChangedAt: string;
  requiresAdminAttention: boolean;
  pendingTasks: number;
  scheduledInstallationDate: string | null;
  createdAt: string;
};

export type DashboardOverviewProps = {
  metrics: OrdersMetrics;
  stageDistribution: StageDistributionEntry[];
  usersMetrics: UsersMetrics;
  orders: DashboardOverviewOrder[];
  generatedAt: string;
};

export function DashboardOverview({ metrics, stageDistribution, usersMetrics, orders, generatedAt }: DashboardOverviewProps) {
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
          value={metrics.scheduledInstallations}
          icon={CalendarDays}
          description="Status SCHEDULED z przyszłą datą rozpoczęcia."
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

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {order.clientName} {cityLabel}
          </p>
          {partnerLabel ? <p className="text-xs text-muted-foreground">{partnerLabel}</p> : null}
        </div>
        <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
          {orderStageLabels[order.stage]}
        </Badge>
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
