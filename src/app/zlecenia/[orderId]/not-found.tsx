import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function OrderNotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 items-center justify-center p-6">
      <Empty className="border border-dashed border-border/60 bg-background/80 p-10 text-center shadow-sm">
        <EmptyMedia variant="icon">
          <ArrowLeft className="size-8 text-muted-foreground" aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Nie znaleziono zlecenia</EmptyTitle>
          <EmptyDescription>
            Sprawdź, czy adres URL jest poprawny, lub wróć do listy i wybierz zlecenie ponownie.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild size="lg" className="mt-4">
          <Link href="/zlecenia">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Wróć do listy zleceń
          </Link>
        </Button>
      </Empty>
    </div>
  )
}
