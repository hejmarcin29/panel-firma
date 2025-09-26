"use client"
import { useState } from 'react'

type DeliverySlot = {
  id: string
  plannedAt: Date | number | null
  windowStart: Date | number | null
  windowEnd: Date | number | null
  status: 'planned' | 'confirmed' | 'completed' | 'canceled' | string
  carrier: string | null
  trackingNo: string | null
  note: string | null
}

type InstallationSlot = {
  id: string
  plannedAt: Date | number | null
  windowStart: Date | number | null
  windowEnd: Date | number | null
  status: 'planned' | 'confirmed' | 'completed' | 'canceled' | string
  installerId: string | null
  installerName?: string | null
  durationMinutes: number | null
  note: string | null
}

function fmt(d: Date | number | null) {
  if (!d) return '—'
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleString()
}

function ActionButtons({ onConfirm, onComplete, onCancel, onReschedule, disabled }: {
  onConfirm?: () => void
  onComplete?: () => void
  onCancel?: () => void
  onReschedule?: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {onConfirm && <button type="button" onClick={onConfirm} disabled={disabled} className="inline-flex h-7 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Potwierdź</button>}
      {onComplete && <button type="button" onClick={onComplete} disabled={disabled} className="inline-flex h-7 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Zakończ</button>}
      {onCancel && <button type="button" onClick={onCancel} disabled={disabled} className="inline-flex h-7 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Anuluj</button>}
      {onReschedule && <button type="button" onClick={onReschedule} disabled={disabled} className="inline-flex h-7 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Przełóż</button>}
    </div>
  )
}

export function DeliverySlotsList({ orderId, slots }: { orderId: string; slots: DeliverySlot[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const patch = async (slotId: string, payload: any) => {
    setBusy(slotId)
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/dostawy/${slotId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Błąd')
      location.reload()
    } finally {
      setBusy(null)
    }
  }

  const onReschedule = async (slotId: string) => {
    const val = prompt('Podaj nową datę i godzinę (YYYY-MM-DD HH:mm)')
    if (!val) return
    const iso = val.replace(' ', 'T')
    const when = new Date(iso)
    if (isNaN(when.getTime())) return alert('Nieprawidłowa data')
    await patch(slotId, { plannedAt: when.getTime() })
  }

  if (!slots?.length) return null
  return (
    <div>
      <div className="text-sm font-medium mb-1">Dostawy</div>
      <div className="space-y-2">
        {slots.map(s => (
          <div key={s.id} className="rounded-md border border-black/10 dark:border-white/10 p-2 text-sm flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <div><span className="opacity-70">Plan:</span> {fmt(s.plannedAt)} {s.status ? <span className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">{s.status}</span> : null}</div>
              <div className="opacity-70">Okno: {fmt(s.windowStart)} – {fmt(s.windowEnd)}</div>
              {(s.carrier || s.trackingNo) && <div className="opacity-70">{s.carrier || ''} {s.trackingNo ? `(${s.trackingNo})` : ''}</div>}
              {s.note && <div className="opacity-70">{s.note}</div>}
            </div>
            <ActionButtons
              onConfirm={s.status==='planned' ? () => patch(s.id, { status: 'confirmed' }) : undefined}
              onComplete={s.status!=='completed' && s.status!=='canceled' ? () => patch(s.id, { status: 'completed' }) : undefined}
              onCancel={s.status!=='canceled' && s.status!=='completed' ? () => patch(s.id, { status: 'canceled' }) : undefined}
              onReschedule={s.status!=='completed' && s.status!=='canceled' ? () => onReschedule(s.id) : undefined}
              disabled={busy === s.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InstallationSlotsList({ orderId, slots }: { orderId: string; slots: InstallationSlot[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const patch = async (slotId: string, payload: any) => {
    setBusy(slotId)
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/montaze/${slotId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Błąd')
      location.reload()
    } finally {
      setBusy(null)
    }
  }

  const onReschedule = async (slotId: string) => {
    const val = prompt('Podaj nową datę i godzinę (YYYY-MM-DD HH:mm)')
    if (!val) return
    const iso = val.replace(' ', 'T')
    const when = new Date(iso)
    if (isNaN(when.getTime())) return alert('Nieprawidłowa data')
    await patch(slotId, { plannedAt: when.getTime() })
  }

  if (!slots?.length) return null
  return (
    <div>
      <div className="text-sm font-medium mb-1">Montaże</div>
      <div className="space-y-2">
        {slots.map(s => (
          <div key={s.id} className="rounded-md border border-black/10 dark:border-white/10 p-2 text-sm flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <div><span className="opacity-70">Plan:</span> {fmt(s.plannedAt)} {s.status ? <span className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">{s.status}</span> : null}</div>
              <div className="opacity-70">Okno: {fmt(s.windowStart)} – {fmt(s.windowEnd)}</div>
              <div className="opacity-70">Montażysta: {s.installerName || s.installerId || '—'}</div>
              {s.durationMinutes != null && <div className="opacity-70">Czas: {s.durationMinutes} min</div>}
              {s.note && <div className="opacity-70">{s.note}</div>}
            </div>
            <ActionButtons
              onConfirm={s.status==='planned' ? () => patch(s.id, { status: 'confirmed' }) : undefined}
              onComplete={s.status!=='completed' && s.status!=='canceled' ? () => patch(s.id, { status: 'completed' }) : undefined}
              onCancel={s.status!=='canceled' && s.status!=='completed' ? () => patch(s.id, { status: 'canceled' }) : undefined}
              onReschedule={s.status!=='completed' && s.status!=='canceled' ? () => onReschedule(s.id) : undefined}
              disabled={busy === s.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
