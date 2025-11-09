import { desc } from "drizzle-orm";
import Link from "next/link";

import { dropshippingOrders } from "@db/schema";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DROPSHIPPING_CHANNEL_OPTIONS,
  DROPSHIPPING_STAGE_LABELS,
} from "@/lib/dropshipping/constants";
import { formatPln } from "@/lib/utils";

import { db } from "@db";

const channelLabels = Object.fromEntries(
  DROPSHIPPING_CHANNEL_OPTIONS.map(({ value, label }) => [value, label]),
);

export default async function DropshippingPage() {
  const orders = await db
    .select({
      id: dropshippingOrders.id,
      orderNumber: dropshippingOrders.orderNumber,
      clientName: dropshippingOrders.clientName,
      status: dropshippingOrders.status,
      netValue: dropshippingOrders.netValue,
      grossValue: dropshippingOrders.grossValue,
      packagesCount: dropshippingOrders.packagesCount,
      channel: dropshippingOrders.channel,
      createdAt: dropshippingOrders.createdAt,
      supplier: dropshippingOrders.supplier,
    })
    .from(dropshippingOrders)
    .orderBy(desc(dropshippingOrders.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Kanał dropshipping</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Wprowadzaj zamówienia ręcznie i kontroluj kolejne etapy: od proformy, przez kontakt z hurtownią,
            po fakturę końcową i wysyłkę do klienta.
          </p>
        </div>
        <Button asChild className="rounded-2xl">
          <Link href="/dropshipping/nowe">Dodaj zamówienie</Link>
        </Button>
      </header>

      <Card className="rounded-3xl border">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">Otwarta kolejka wysyłek</CardTitle>
          <CardDescription>Monitoruj, co wymaga kolejnego kroku.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                <TableHead>Zamówienie</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Etap</TableHead>
                <TableHead>Kanał</TableHead>
                <TableHead>Ilość op.</TableHead>
                <TableHead>Wartość netto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Brak zamówień. Dodaj pierwsze zlecenie, aby śledzić proces.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {DROPSHIPPING_STAGE_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {channelLabels[order.channel] ?? order.channel}
                    </TableCell>
                    <TableCell>{order.packagesCount}</TableCell>
                    <TableCell>{formatPln(order.netValue)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" className="gap-2 text-sm">
                        <Link href={`/dropshipping/${order.id}`}>Szczegóły</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
