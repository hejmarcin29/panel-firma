import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabItems = [
  { value: 'overview', label: 'Przegląd' },
  { value: 'measurements', label: 'Pomiary' },
  { value: 'installations', label: 'Montaże' },
  { value: 'deliveries', label: 'Dostawy' },
  { value: 'tasks', label: 'Zadania' },
  { value: 'documents', label: 'Dokumenty' },
  { value: 'history', label: 'Historia' },
]

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-72 sm:w-96" />
            <Skeleton className="h-14 w-full max-w-2xl" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
          <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
            <CardContent className="flex flex-col gap-1 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-primary/10 shadow-lg shadow-primary/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-3xl border border-border/60">
            <CardHeader className="space-y-2 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="flex w-full overflow-hidden">
          {tabItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value} disabled>
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="lg:col-span-2">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6 lg:grid lg:grid-cols-1">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {tabItems
          .filter((item) => item.value !== 'overview')
          .map((item) => (
            <TabsContent key={item.value} value={item.value} className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="rounded-3xl border border-border/60">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 3 }).map((__, contentIndex) => (
                    <Skeleton key={contentIndex} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
            </TabsContent>
          ))}
      </Tabs>
    </div>
  )
}
