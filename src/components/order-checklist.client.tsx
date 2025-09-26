"use client"
import { useState } from 'react'

type Props = { orderId: string; type: 'delivery'|'installation'; items: { key: string; done: boolean }[] }

const checklistByType: Record<'delivery'|'installation', { key: string; label: string }[]> = {
  delivery: [
    { key: 'proforma', label: 'Faktura proforma' },
    { key: 'advance_invoice', label: 'Faktura zaliczkowa' },
    { key: 'final_invoice', label: 'Faktura końcowa' },
    { key: 'post_delivery_invoice', label: 'FV (płatność po dostawie)' },
    { key: 'quote', label: 'Wycena' },
    { key: 'done', label: 'Koniec' },
  ],
  installation: [
    { key: 'measurement', label: 'Pomiar' },
    { key: 'quote', label: 'Wycena' },
    { key: 'contract', label: 'Umowa' },
    { key: 'advance_payment', label: 'Zaliczka' },
    { key: 'installation', label: 'Montaż' },
    { key: 'handover_protocol', label: 'Protokół odbioru' },
    { key: 'final_invoice', label: 'Faktura końcowa' },
    { key: 'done', label: 'Koniec' },
  ],
}

export function OrderChecklist({ orderId, type, items }: Props) {
  const map = new Map(items.map(i => [i.key, i.done]))
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(key: string, done: boolean) {
    setBusy(key)
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/checklist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, done }) })
      if (!res.ok) throw new Error('Błąd')
      location.reload()
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-2">
      {checklistByType[type].map(item => {
        const checked = map.get(item.key) || false
        return (
          <label key={item.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={checked} disabled={busy === item.key} onChange={(e) => toggle(item.key, e.target.checked)} />
            <span>{item.label}</span>
          </label>
        )
      })}
    </div>
  )
}
