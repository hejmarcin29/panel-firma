"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pl } from '@/i18n/pl'
import { useToast } from '@/components/ui/toaster'

type Props = { id: string; status: string }

export function OrderStatusButtons({ id, status }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const transitions: Record<string, string[]> = {
    awaiting_measurement: ['ready_to_schedule', 'cancelled'],
    ready_to_schedule: ['scheduled', 'cancelled'],
    scheduled: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }

  const next = transitions[status] || []

  async function setStatus(s: string) {
    try {
      setLoading(s)
      const r = await fetch(`/api/zlecenia/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast({
          title: 'Nie udało się zmienić statusu',
          description: (data && (data.error || data.message)) || `Kod: ${r.status}`,
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Status zaktualizowany', variant: 'success' })
      router.refresh()
    } catch (e) {
      toast({ title: 'Błąd sieci/klienta', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  if (next.length === 0) return <div className="text-xs opacity-70">Brak dostępnych przejść.</div>

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          disabled={!!loading}
          className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-60 disabled:cursor-not-allowed dark:border-white/15 dark:hover:bg-white/10"
          type="button"
        >
          {loading === s ? 'Zapisywanie…' : `Ustaw: ${(pl.orders.statuses as Record<string, string>)[s] || s}`}
        </button>
      ))}
    </div>
  )
}
