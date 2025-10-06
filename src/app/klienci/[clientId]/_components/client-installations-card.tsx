import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle, CalendarRange, HardHat, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ClientInstallationSummary } from "@/lib/clients";
import type { InstallationStatus } from "@db/schema";

const statusClassMap: Record<InstallationStatus, string> = {
  PLANNED: "bg-muted/50 text-muted-foreground",
  SCHEDULED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

function formatSchedule(start: Date | null, end: Date | null) {
  if (start && end) {
    return `${format(start, "dd MMM yyyy", { locale: pl })} – ${format(end, "dd MMM yyyy", { locale: pl })}`;
  }
  if (start) {
    return format(start, "dd MMM yyyy", { locale: pl });
  }
  return "Brak zaplanowanego terminu";
}

type ClientInstallationsCardProps = {
  clientId: string;
  clientName: string;
  installations: ClientInstallationSummary[];
};

export function ClientInstallationsCard({ clientId, clientName, installations }: ClientInstallationsCardProps) {
  return (
    <Card className="rounded-3xl border border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Montaże</CardTitle>
            <CardDescription>Aktualne i historyczne montaże powiązane z klientem.</CardDescription>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/montaze/nowy?clientId=${clientId}`}>
              <HardHat className="mr-2 size-4" aria-hidden />
              Zaplanuj montaż
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {installations.length === 0 ? (
          <Empty className="border-none bg-muted/20">
            <EmptyMedia variant="icon">
              <HardHat className="size-6 text-primary" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak montaży</EmptyTitle>
              <EmptyDescription>
                Nie zaplanowano jeszcze montaży dla klienta {clientName}. Utwórz pierwszy, aby pojawił się na liście.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {installations.map((installation) => (
              <div
                key={installation.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {installation.installationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {installation.orderTitle ?? `Powiązane ze zleceniem ${installation.orderReference}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full px-3 py-1 text-xs ${statusClassMap[installation.status]}`}>
                      {installation.statusLabel}
                    </Badge>
                    {installation.requiresAdminAttention ? (
                      <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                        <AlertTriangle className="mr-1 size-3" aria-hidden />
                        Wymaga uwagi
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="size-3" aria-hidden />
                    {formatSchedule(installation.scheduledStartAt, installation.scheduledEndAt)}
                  </span>
                  {installation.assignedInstallerName ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" aria-hidden />
                      {installation.assignedInstallerName}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-xs">
                  <Link
                    href={`/zlecenia/${installation.orderId}`}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Przejdź do zlecenia
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
