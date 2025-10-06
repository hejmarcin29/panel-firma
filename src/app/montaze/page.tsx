import Link from "next/link";

import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertCircle, CalendarDays, HardHat, PlusCircle, Search, ShieldAlert, Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getInstallationsDashboardData } from "@/lib/installations";
import { installationStatusLabels } from "@/lib/installations/constants";

import { installationsColumns } from "./columns";
import { InstallationsTable } from "./installations-table";

export const metadata = {
  title: "Montaże",
  description: "Monitoruj harmonogram montaży i szybko przechodź do edycji zleceń.",
};

const formatDate = (value: Date | null | undefined) =>
  value ? format(value, "dd MMM yyyy", { locale: pl }) : null;

type MontazePageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function MontazePage({ searchParams }: MontazePageProps) {
  const { snapshot, list } = await getInstallationsDashboardData(60);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQueryRaw = resolvedSearchParams?.q ?? "";
  const initialQuery = initialQueryRaw.trim();

  const now = new Date();

  const sortedBySchedule = list
    .filter((installation) => installation.scheduledStartAt)
    .sort((a, b) => {
      const aValue = a.scheduledStartAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const bValue = b.scheduledStartAt?.getTime() ?? Number.POSITIVE_INFINITY;
      return aValue - bValue;
    });

  const nextInstallation = sortedBySchedule.find(
    (installation) => installation.scheduledStartAt && installation.scheduledStartAt > now,
  ) ?? null;

  const todaysInstallations = list.filter(
    (installation) => installation.scheduledStartAt && isSameDay(installation.scheduledStartAt, now),
  ).length;

  const nextInstallationDate = formatDate(nextInstallation?.scheduledStartAt);
  const nextInstallationLabel =
    nextInstallation?.clientName ??
    nextInstallation?.addressCity ??
    nextInstallation?.installationNumber ??
    "Brak danych";

  const attentionHint =
    snapshot.metrics.requiringAttention === 0
      ? "Brak montaży z flagą administracyjną."
      : snapshot.metrics.requiringAttention === 1
        ? "Jeden montaż wymaga interwencji administratora."
        : `${snapshot.metrics.requiringAttention} montaże wymagają interwencji administratora.`;

  const stats = [
    {
      label: "Łącznie montaży",
      value: snapshot.metrics.total,
      hint: "Aktywne i historyczne rekordy",
    },
    {
      label: "Zaplanowane",
      value: snapshot.metrics.scheduled,
      hint: "Status 'Zaplanowany' z przyszłą datą",
    },
    {
      label: "W realizacji",
      value: snapshot.metrics.inProgress,
      hint: "Status 'W realizacji'",
    },
    {
      label: "Zakończone",
      value: snapshot.metrics.completed,
      hint: "Status 'Zakończony'",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-emerald-200/20 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-full border-emerald-500/50 text-emerald-600">
            Montaże
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Koordynuj harmonogram ekip montażowych
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Korzystaj z tabeli poniżej, aby monitorować postęp i przechodzić do zlecenia w jednym kliknięciu. W widoku
              zlecenia znajdziesz przycisk „Edytuj zlecenie” oraz powiązane dostawy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-emerald-50 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
              <Link href="/montaze/nowy">
                <HardHat className="mr-2 size-4" aria-hidden />
                Zaplanuj montaż
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-full border-emerald-500/60 px-5 py-2 text-sm font-semibold text-emerald-600 shadow-sm"
            >
              <Link href="/montaze/nowa-dostawa">
                <PlusCircle className="mr-2 size-4" aria-hidden />
                Dodaj dostawę pod montaż
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-emerald-600"
            >
              <Link href="/zlecenia">
                <Users className="size-4" aria-hidden />
                Przejdź do pipeline’u
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {nextInstallation ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600">
                <CalendarDays className="size-3.5" aria-hidden />
                Najbliższy montaż:
                <span className="font-semibold">{nextInstallationDate ?? "w trakcie ustalania"}</span>
                <span className="text-emerald-500/80">• {nextInstallationLabel}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden />
                Brak zaplanowanych montaży – utwórz pierwszy harmonogram.
              </div>
            )}
            {initialQuery ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600">
                <Search className="size-3.5" aria-hidden />
                Aktywny filtr: <span className="font-semibold">{initialQuery}</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
          <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-emerald-500/10">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-muted-foreground">Dzisiejsze montaże</span>
              <span className="text-2xl font-semibold text-foreground">{todaysInstallations}</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-red-500/10 shadow-lg shadow-red-500/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-red-900/80 dark:text-red-100/80">Wymaga uwagi</span>
              <span className="text-2xl font-semibold text-red-900 dark:text-red-100">
                {snapshot.metrics.requiringAttention}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      <Alert className="flex items-start gap-3 rounded-3xl border border-border/60 bg-muted/40">
        <AlertCircle className="mt-1 size-5 text-emerald-600" aria-hidden />
        <div className="space-y-1">
          <AlertTitle>Jak edytować zlecenie powiązane z montażem?</AlertTitle>
          <AlertDescription>
            Kliknij dowolny wiersz w tabeli harmonogramu. Zostaniesz przeniesiony do szczegółów zlecenia, gdzie w górnej
            części strony dostępny jest przycisk <span className="font-semibold">„Edytuj zlecenie”</span> oraz sekcja
            statusów i terminów.
          </AlertDescription>
        </div>
      </Alert>

      <section className="grid gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-3xl border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <ShieldAlert className="size-4 text-muted-foreground" aria-hidden />
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
            <CardTitle className="text-lg font-semibold text-foreground">Nadchodzące montaże</CardTitle>
            <CardDescription>Ostatnio dodane i zaplanowane realizacje wraz ze statusem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.recent.length ? (
              snapshot.recent.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">#{item.installationNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.clientName ?? "Klient nieznany"}
                      {item.city ? ` • ${item.city}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <Badge variant="secondary" className="rounded-full bg-muted px-3 py-1 text-xs">
                      {installationStatusLabels[item.status]}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(item.scheduledStartAt) ?? "Termin do ustalenia"}
                    </span>
                    <Link
                      href={`/zlecenia/${item.orderId}`}
                      className="text-xs font-medium text-emerald-600 underline-offset-4 hover:underline"
                    >
                      Otwórz zlecenie #{item.orderReference}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Brak ostatnich montaży. Zaplanuj pierwszy montaż, aby rozpocząć monitorowanie harmonogramu.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Szybkie wskaźniki</CardTitle>
            <CardDescription>Stan harmonogramu na teraz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="font-medium text-foreground">Montaże dziś</span>
              <span className="text-base font-semibold text-foreground">{todaysInstallations}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="font-medium text-foreground">W realizacji</span>
              <span className="text-base font-semibold text-foreground">{snapshot.metrics.inProgress}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
              <span className="font-medium text-red-600 dark:text-red-300">Wymaga reakcji</span>
              <span className="text-base font-semibold text-red-600 dark:text-red-200">
                {snapshot.metrics.requiringAttention}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{attentionHint}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border border-border/60">
        <CardContent className="p-6">
          <InstallationsTable columns={installationsColumns} data={list} initialQuery={initialQuery} />
        </CardContent>
      </Card>
    </div>
  );
}
