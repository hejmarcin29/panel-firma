import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNextDropshippingOrderNumber } from "@/lib/dropshipping";

import { NewDropshippingOrderForm } from "../_components/new-order-form";

export default async function NewDropshippingOrderPage() {
  const { orderNumber } = await getNextDropshippingOrderNumber();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Nowe zamówienie dropshipping</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Uzupełnij dane z kanału sprzedaży, wybierz dostawcę i przygotuj checklistę zadań dla zespołu.
          </p>
        </div>
        <Button asChild variant="ghost" className="rounded-2xl">
          <Link href="/dropshipping">Wróć do listy</Link>
        </Button>
      </header>

      <Card className="rounded-3xl border">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-lg font-semibold">Dane zamówienia</CardTitle>
          <CardDescription>
            Numer zlecenia oraz wartości netto/brutto obliczamy automatycznie – wystarczy, że opiszesz wszystkie
            pozycje towarowe.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10">
          <NewDropshippingOrderForm orderNumberHint={orderNumber} />
        </CardContent>
      </Card>
    </div>
  );
}
