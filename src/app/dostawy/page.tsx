import Link from "next/link";

import { Package, PlusCircle, Route } from "lucide-react";

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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function DostawyPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Dostawy
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
            Zaprojektuj moduł logistyczny
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
            Ten widok jest gotowy na Twoje dane. Dodaj listę dostaw, wskaźniki transportu i integracje z przewoźnikami,
            aby kontrolować każdy etap wysyłki materiałów.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-full border-dashed border-primary/60 text-primary">
            <Link href="/zlecenia">
              Skonfiguruj pipeline zleceń
            </Link>
          </Button>
          <Button size="sm" asChild className="rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            <Link href="/dostawy/nowa">
              <PlusCircle className="mr-2 size-4" aria-hidden />
              Dodaj dostawę
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="size-5 text-primary" aria-hidden />
            Zacznij śledzić łańcuch dostaw
          </CardTitle>
          <CardDescription>
            Poprowadź zespół przez proces przygotowania wysyłki – od planowania, po faktury i feedback klienta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed border-border/60 bg-muted/40">
            <EmptyMedia variant="icon">
              <Package className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak skonfigurowanych widoków dostaw</EmptyTitle>
              <EmptyDescription>
                Dodaj backendowe źródło danych, zbuduj tabelę dostaw i połącz ją z akcjami serwerowymi, aby zarządzać wysyłkami.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="text-left">
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Stwórz endpoint lub akcję zwracającą listę dostaw z aktualnym statusem.</li>
                <li>Zaprojektuj komponent tabeli z filtrami etapów i planowaną datą transportu.</li>
                <li>Dodaj integrację z przewoźnikami lub automatyczne powiadomienia o wysyłce.</li>
              </ul>
            </EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" asChild className="rounded-full bg-primary px-4 font-semibold text-primary-foreground">
                <Link href="/dostawy/nowa">
                  <PlusCircle className="mr-2 size-4" aria-hidden />
                  Utwórz dostawę
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-full border-border/70">
                <Link href="/zlecenia">
                  Zobacz pipeline zleceń
                </Link>
              </Button>
            </div>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
