"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { orderId: string; type: 'delivery'|'installation'; stage: string|null }

const stages = {
  delivery: [
    { value: 'offer_sent', label: 'Wysłana oferta' },
    { value: 'awaiting_payment', label: 'Czeka na wpłatę' },
    { value: 'delivery', label: 'Dostawa' },
    { value: 'final_invoice_issued', label: 'Wystawiona faktura końcowa' },
    { value: 'done', label: 'Koniec' },
  ],
  installation: [
    { value: 'awaiting_measurement', label: 'Czeka na pomiar' },
    { value: 'awaiting_quote', label: 'Czeka na wycenę' },
    { value: 'before_contract', label: 'Przed umową' },
    { value: 'before_advance', label: 'Przed zaliczką' },
    { value: 'before_installation', label: 'Przed montażem' },
    { value: 'before_final_invoice', label: 'Przed fakturą końcową' },
    { value: 'done', label: 'Koniec' },
  ],
} as const

export function OrderPipeline({ orderId, type, stage }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(stage ?? '')
  const [loading, setLoading] = useState(false)
  const opts = stages[type]

  async function save(newStage: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/pipeline`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: newStage }) })
      if (!res.ok) throw new Error('Błąd')
      router.refresh()
    } catch (e) {
      // TODO toaster
      console.error(e)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Etap (biznesowy)</label>
        <select className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm dark:border-white/15" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">— wybierz —</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <button type="button" disabled={!value || loading} className="h-9 px-3 rounded-md border border-black/15 text-sm hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10" onClick={() => save(value)}>Zapisz</button>
    </div>
  )
}
