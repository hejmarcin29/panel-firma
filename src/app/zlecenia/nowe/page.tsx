import Link from 'next/link'
import { AlertTriangle, HardHat, Truck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Zlecenia powstają automatycznie',
  description: 'Dowiedz się, jak planować montaż lub dostawę bez ręcznego tworzenia zlecenia.',
}

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Automatyczne zlecenia
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Zlecenie tworzy się samo, gdy planujesz działanie
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Nie musisz już zakładać zlecenia ręcznie. Wystarczy, że wybierzesz klienta i zaplanujesz montaż lub dostawę –
              system utworzy numer zlecenia i powiąże wszystkie działania automatycznie.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-primary/20">
              <Link href="/montaze/nowy">
                <HardHat className="size-4" aria-hidden />
                Zaplanuj montaż
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2 rounded-full px-5 py-2 text-sm font-semibold text-primary shadow-sm">
              <Link href="/dostawy/nowa">
                <Truck className="size-4" aria-hidden />
                Zaplanuj dostawę
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border border-border/60">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertTriangle className="size-5 text-primary" aria-hidden />
            Dlaczego nie ma formularza zlecenia?
          </CardTitle>
          <CardDescription>
            Chcemy, aby proces zaczynał się od realnego działania. Gdy planujesz montaż lub dostawę, klient otrzymuje
            automatycznie utworzone zlecenie z numeracją bazującą na numerze klienta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Jak to działa?</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Dodajesz klienta (jeśli nie istnieje) w zakładce Klienci.</li>
              <li>Planujesz montaż lub dostawę, wybierając klienta.</li>
              <li>System nadaje nowy numer zlecenia i łączy wszystkie powiązane działania.</li>
            </ul>
          </div>
          <Separator className="border-border/60" />
          <div className="space-y-2">
            <p className="font-medium text-foreground">Potrzebujesz wglądu w stan klienta?</p>
            <p>
              Przejdź do zakładki{' '}
              <Link href="/klienci" className="font-medium text-primary underline-offset-4 hover:underline">
                Klienci
              </Link>
              , wybierz klienta i skorzystaj z akcji „Zaplanuj montaż” lub „Zaplanuj dostawę” bezpośrednio z jego profilu.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
