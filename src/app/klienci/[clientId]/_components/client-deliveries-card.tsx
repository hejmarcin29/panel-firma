import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle, CalendarClock, HardHat, Package, Truck } from "lucide-react";

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
import type { ClientDeliverySummary } from "@/lib/clients";
import type { DeliveryStage } from "@db/schema";

const stageClassMap: Record<DeliveryStage, string> = {
  RECEIVED: "bg-muted/50 text-muted-foreground",
  PROFORMA_SENT_AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  SHIPPING_ORDERED: "bg-sky-100 text-sky-700",
  DELIVERED_AWAITING_FINAL_INVOICE: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

type ClientDeliveriesCardProps = {
  clientId: string;
  clientName: string;
  deliveries: ClientDeliverySummary[];
};

export function ClientDeliveriesCard({ clientId, clientName, deliveries }: ClientDeliveriesCardProps) {
  return (
    <Card className="rounded-3xl border border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Dostawy</CardTitle>
            <CardDescription>Ostatnie zamówienia logistyczne dla tego klienta.</CardDescription>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dostawy/nowa?clientId=${clientId}`}>
              <Truck className="mr-2 size-4" aria-hidden />
              Dodaj dostawę
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <Empty className="border-none bg-muted/20">
            <EmptyMedia variant="icon">
              <Package className="size-6 text-primary" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak dostaw</EmptyTitle>
              <EmptyDescription>
                Jeszcze nie zarejestrowano dostaw dla klienta {clientName}. Dodaj pierwszą, aby kontrolować logistykę.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{delivery.deliveryNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.orderTitle
                        ? `Powiązane ze zleceniem ${delivery.orderTitle}`
                        : delivery.orderReference
                          ? `Powiązane ze zleceniem ${delivery.orderReference}`
                          : "Tylko dostawa"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full px-3 py-1 text-xs ${stageClassMap[delivery.stage]}`}>
                      {delivery.stageLabel}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
                      {delivery.typeLabel}
                    </Badge>
                    {delivery.requiresAdminAttention ? (
                      <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                        <AlertTriangle className="mr-1 size-3" aria-hidden />
                        Wymaga uwagi
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" aria-hidden />
                    {delivery.scheduledDate
                      ? format(delivery.scheduledDate, "dd MMM yyyy", { locale: pl })
                      : "Brak terminu"}
                  </span>
                  {delivery.installationId ? (
                    <span className="inline-flex items-center gap-1">
                      <HardHat className="size-3" aria-hidden />
                      Powiązana instalacja
                    </span>
                  ) : null}
                </div>
                {delivery.orderId ? (
                  <div className="mt-3 text-xs">
                    <Link
                      href={`/zlecenia/${delivery.orderId}`}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Przejdź do zlecenia
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
