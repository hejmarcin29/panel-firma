"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ScheduleDeliveryForm({ orderId }: { orderId: string }) {
  const [plannedAt, setPlannedAt] = useState<string>("")
  const [carrier, setCarrier] = useState<string>("")
  const [trackingNo, setTrackingNo] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault()
      setLoading(true)
      try {
        const body: Record<string, unknown> = {
          status: 'planned',
          plannedAt: plannedAt ? new Date(plannedAt).getTime() : null,
          carrier: carrier || null,
          trackingNo: trackingNo || null,
          note: note || null,
        }
        await fetch(`/api/zlecenia/${orderId}/dostawy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        setPlannedAt("")
        setCarrier("")
        setTrackingNo("")
        setNote("")
        router.refresh()
      } finally {
        setLoading(false)
      }
    }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="text-xs opacity-70">Data dostawy</label>
          <Input type="datetime-local" value={plannedAt} onChange={(e) => setPlannedAt(e.currentTarget.value)} />
        </div>
        <div>
          <label className="text-xs opacity-70">Przewoźnik</label>
          <Input value={carrier} onChange={(e) => setCarrier(e.currentTarget.value)} placeholder="np. DPD / własny" />
        </div>
        <div>
          <label className="text-xs opacity-70">Nr śledzenia</label>
          <Input value={trackingNo} onChange={(e) => setTrackingNo(e.currentTarget.value)} />
        </div>
        <div>
          <label className="text-xs opacity-70">Notatka</label>
          <Input value={note} onChange={(e) => setNote(e.currentTarget.value)} placeholder="opcjonalnie" />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={loading}>{loading ? 'Zapisywanie…' : 'Zaplanuj dostawę'}</Button>
    </form>
  )
}
