import Link from "next/link";

import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

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
import { kpis, dropshippingOrders } from "@/data/dashboard";
import { cn } from "@/lib/utils";

export default function PanelPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs uppercase tracking-wide">
          Wersja MVP
        </Badge>
        <h1 className="text-3xl font-semibold text-foreground">Przegląd operacyjny</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Monitoruj stan zamówień dropshippingowych i kluczowe wskaźniki logistyki, aby dowozić wysyłki na czas.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.length === 0 ? (
          <Card className="rounded-3xl border bg-muted/20">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base font-semibold">Brak danych KPI</CardTitle>
              <CardDescription>
                Zintegruj panel z realnymi danymi finansowymi i logistycznymi, aby zobaczyć kluczowe wskaźniki.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Gdy tylko podłączymy źródło danych, w tym miejscu pojawią się najważniejsze liczby dla zespołu operacji.
            </CardContent>
          </Card>
        ) : (
          kpis.map((kpi) => {
            const isPositive = kpi.trend === "up";
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            return (
              <Card key={kpi.title} className="rounded-3xl border bg-card">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      isPositive ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    <TrendIcon className="h-3.5 w-3.5" />
                    {isPositive ? "Wzrost" : "Spadek"}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">{kpi.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{kpi.change}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <section className="grid gap-4">
        <Card className="rounded-3xl border">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">Priorytetowe wysyłki</CardTitle>
            <CardDescription>Pilnuj terminów dostaw i statusów kompletacji paczek.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zamówienie</TableHead>
                  <TableHead>Odbiorca</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ilość szt.</TableHead>
                  <TableHead>Wartość netto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dropshippingOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Brak zamówień oczekujących na wysyłkę. Dodaj nowe zlecenia dropshipping, aby pojawiły się w tym
                      przeglądzie.
                    </TableCell>
                  </TableRow>
                ) : (
                  dropshippingOrders.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.items}</TableCell>
                      <TableCell>{item.value}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button asChild variant="ghost" className="gap-2 text-sm">
                <Link href="/dropshipping/nowe">
                  Dodaj nowe zamówienie
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
