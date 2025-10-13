import { Clock, Mail, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth";
import { getSessionEntries } from "@/lib/sessions";
import { getEmailSettings } from "@/lib/settings/email";
import { getUsersMetrics } from "@/lib/users";
import type { SessionStats } from "./_components/session-management";
import { SessionManagement } from "./_components/session-management";
import { EmailSettingsForm } from "./_components/email-settings-form";

export const metadata = {
  title: "Ustawienia administratora",
  description: "Monitoruj aktywne sesje, historię logowań i kontroluj dostęp do panelu.",
};

function formatMetric(value: number) {
  return new Intl.NumberFormat("pl-PL").format(value);
}

export default async function SettingsPage() {
  const session = await requireRole(["ADMIN"]);
  const [entries, emailSettings, metrics] = await Promise.all([
    getSessionEntries({ includeExpired: true, limit: 250 }),
    getEmailSettings(),
    getUsersMetrics(),
  ]);

  const sessionEntries = entries.map((entry) => ({
    ...entry,
    isCurrent: entry.id === session.id,
    isMine: entry.userId === session.user.id,
  }));

  const activeSessions = sessionEntries.filter((entry) => !entry.isExpired);
  const stats: SessionStats = {
    totalActive: activeSessions.length,
    activeLast24h: activeSessions.filter((entry) => entry.isRecent).length,
    expired: sessionEntries.filter((entry) => entry.isExpired).length,
    uniqueUsers: new Set(activeSessions.map((entry) => entry.userId)).size,
    currentUserSessions: activeSessions.filter((entry) => entry.userId === session.user.id).length,
  };

  const serializedSessions = sessionEntries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    username: entry.username,
    name: entry.name,
    role: entry.role,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    expiresAt: entry.expiresAt.toISOString(),
    tokenPreview: entry.tokenPreview,
    isExpired: entry.isExpired,
    isRecent: entry.isRecent,
    isCurrent: entry.isCurrent,
  }));

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
              Ustawienia
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Zarządzanie dostępem i komunikacją
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Kontroluj bezpieczeństwo kont administratorów, zarządzaj aktywnymi sesjami oraz konfiguruj kanały powiadomień, aby zespół reagował bez opóźnień.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <Card className="rounded-2xl border-none bg-primary/10 shadow-primary/15">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-primary">Aktywne sesje</span>
                <span className="text-2xl font-semibold text-primary">
                  {formatMetric(stats.totalActive)}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-emerald-500/10 shadow-emerald-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-emerald-900/80 dark:text-emerald-200/80">Ostatnie 24h</span>
                <span className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
                  {formatMetric(stats.activeLast24h)}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-amber-500/10 shadow-amber-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-amber-900/80 dark:text-amber-100/80">Wygasłe</span>
                <span className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                  {formatMetric(stats.expired)}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-sky-500/10 shadow-sky-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-sky-900/80 dark:text-sky-100/80">Użytkownicy</span>
                <span className="text-2xl font-semibold text-sky-900 dark:text-sky-100">
                  {formatMetric(stats.uniqueUsers)}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Tabs defaultValue="security" className="flex flex-col gap-6">
        <TabsList className="w-full justify-start overflow-x-auto rounded-2xl border border-border/60 bg-muted/40 p-1 text-sm">
          <TabsTrigger
            value="security"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <ShieldCheck className="size-4" aria-hidden />
            Bezpieczeństwo
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Mail className="size-4" aria-hidden />
            Powiadomienia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-0 space-y-6">
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Administratorzy</CardTitle>
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent className="space-y-1">
                <span className="text-2xl font-semibold text-foreground">{formatMetric(metrics.admins)}</span>
                <p className="text-xs text-muted-foreground">Pełny dostęp do konfiguracji oraz zarządzanie zespołem.</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monterzy</CardTitle>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent className="space-y-1">
                <span className="text-2xl font-semibold text-foreground">{formatMetric(metrics.installers)}</span>
                <p className="text-xs text-muted-foreground">Brygady terenowe realizujące montaże i raporty.</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Partnerzy</CardTitle>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent className="space-y-1">
                <span className="text-2xl font-semibold text-foreground">{formatMetric(metrics.partners)}</span>
                <p className="text-xs text-muted-foreground">Sieć sprzedaży odpowiedzialna za pozyskiwanie klientów.</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Twoje sesje</CardTitle>
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{formatMetric(stats.currentUserSessions)}</div>
                <CardDescription>Aktywne połączenia dla Twojego konta administratora.</CardDescription>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aktywne w ostatnich 24h</CardTitle>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{formatMetric(stats.activeLast24h)}</div>
                <CardDescription>Sesje zarejestrowane w ciągu ostatniej doby.</CardDescription>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Wygasłe logowania</CardTitle>
                <Clock className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{formatMetric(stats.expired)}</div>
                <CardDescription>Sesje, które można bezpiecznie usunąć z historii.</CardDescription>
              </CardContent>
            </Card>
          </section>

          <SessionManagement sessions={serializedSessions} stats={stats} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 space-y-6">
          <EmailSettingsForm
            initialSettings={emailSettings.settings}
            lastUpdatedAt={emailSettings.updatedAt ? emailSettings.updatedAt.toISOString() : null}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
