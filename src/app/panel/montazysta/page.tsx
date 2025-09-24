"use client"
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pl } from '@/i18n/pl'
import { z } from 'zod'

type MyOrder = {
  id: string
  clientId: string
  clientName: string
  status: string
  preMeasurementSqm: number | null
  scheduledDate: number | null
  createdAt: number
}

export default function PanelMontazysty() {
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/montazysta/moje')
        const j = await r.json().catch(() => ({}))
        const RespSchema = z.object({ orders: z.array(z.object({
          id: z.string(),
          clientId: z.string(),
          clientName: z.string().optional().default(''),
          status: z.string(),
          preMeasurementSqm: z.number().nullable(),
          scheduledDate: z.number().nullable(),
          createdAt: z.number(),
        })).optional(), error: z.string().optional() })
        const parsed = RespSchema.safeParse(j)
        if (!r.ok) throw new Error(parsed.success ? (parsed.data.error || 'Błąd') : 'Błąd')
        setOrders(parsed.success && parsed.data.orders ? parsed.data.orders : [])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Błąd ładowania'
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Moje montaże</h1>
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded border border-black/10 p-3 dark:border-white/10">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      {!loading && !error && (
        <Card>
          <CardHeader className="pb-2"><CardTitle>Przypisane zlecenia montażu</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-sm opacity-70">Brak przypisanych montaży.</div>
            ) : (
              <div className="divide-y divide-black/10 dark:divide-white/10 rounded border border-black/10 dark:border-white/10">
                {orders.map(o => {
                  const statusLabel = (pl.orders.statuses as Record<string,string>)[o.status] || o.status
                  return (
                    <div key={o.id} className="p-3 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{o.clientName || 'Klient'}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                          Status: <span className="inline-flex items-center rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{statusLabel}</span>
                          <span className="mx-1.5">•</span>
                          m2: {o.preMeasurementSqm ?? '-'}
                          <span className="mx-1.5">•</span>
                          Utworzono: {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {/* TODO: w przyszłości link do szczegółów zlecenia */}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
