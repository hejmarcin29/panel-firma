import Link from "next/link";

import { HardHat, PlusCircle, Sparkles } from "lucide-react";

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

export default function MontazePage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Montaże
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
            Stwórz własny panel operacyjny
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
            Ten widok został wyczyszczony z danych przykładowych. Dodaj własne moduły, listy i analitykę,
            aby monitorować montaże tak, jak potrzebuje Twoja organizacja.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-full border-dashed border-primary/60 text-primary">
            <Link href="/zlecenia">
              Zdefiniuj źródło danych
            </Link>
          </Button>
          <Button size="sm" asChild className="rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            <Link href="/montaze/nowy">
              <PlusCircle className="mr-2 size-4" aria-hidden />
              Zaplanuj montaż
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Zacznij budować swój dashboard
          </CardTitle>
          <CardDescription>
            Uporządkuj sekcję montaży według własnych potrzeb – poniżej znajdziesz listę rekomendowanych kroków.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed border-border/60 bg-muted/40">
            <EmptyMedia variant="icon">
              <HardHat className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak skonfigurowanych widoków montaży</EmptyTitle>
              <EmptyDescription>
                Podłącz API, dodaj własne filtry i zaprojektuj widok listy, aby śledzić postęp oraz zespoły.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="text-left">
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Stwórz backendowy endpoint lub akcję serwerową dostarczającą dane montaży.</li>
                <li>Zbuduj komponent tabeli/karty, który wyrenderuje dane w wybranym układzie.</li>
                <li>Dodaj filtry, sortowanie i wskaźniki KPI, aby wspierać decyzje operacyjne.</li>
              </ul>
            </EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" asChild className="rounded-full bg-primary px-4 font-semibold text-primary-foreground">
                <Link href="/montaze/nowy">
                  <PlusCircle className="mr-2 size-4" aria-hidden />
                  Dodaj montaż
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-full border-border/70">
                <Link href="/zlecenia">
                  Zobacz w pipeline zleceń
                </Link>
              </Button>
            </div>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
