"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toaster'
import { DatePicker } from '@/components/ui/date-picker'

const schema = z.object({
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.string().optional(),
  installerId: z.union([z.string().uuid(), z.literal('')]).optional(),
  // Date-only (YYYY-MM-DD)
  scheduledDate: z.string().optional(),
})

type Values = z.infer<typeof schema>

type Installer = { id: string; name: string | null; email: string; role: string }

export function OrderEditor({ orderId, defaults }: { orderId: string; defaults: { note?: string|null; preMeasurementSqm?: number|null; installerId?: string|null; scheduledDate?: number|null } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [installers, setInstallers] = useState<Installer[]>([])
  const [values, setValues] = useState<Values>({
    note: defaults.note ?? '',
    preMeasurementSqm: defaults.preMeasurementSqm ? String(defaults.preMeasurementSqm) : '',
    installerId: defaults.installerId ?? '',
    // default as date-only string in local TZ
    scheduledDate: defaults.scheduledDate ? new Date(defaults.scheduledDate).toISOString().slice(0,10) : '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/uzytkownicy?role=installer')
        const j = await r.json().catch(() => ({ users: [] }))
        setInstallers((j.users || []).filter((x: Installer) => x.role === 'installer'))
      } catch { /* noop */ }
    })()
  }, [])

  async function save() {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast({ title: 'Błąd', description: 'Popraw dane formularza', variant: 'destructive' })
      return
    }
    const body: Record<string, unknown> = {}
    if (parsed.data.note && parsed.data.note.trim() !== '') body.note = parsed.data.note.trim()
    if (parsed.data.preMeasurementSqm && parsed.data.preMeasurementSqm.trim() !== '') body.preMeasurementSqm = parseInt(parsed.data.preMeasurementSqm, 10)
    if (parsed.data.installerId !== undefined) body.installerId = parsed.data.installerId === '' ? null : parsed.data.installerId
    if (parsed.data.scheduledDate && parsed.data.scheduledDate.trim() !== '') {
      // Normalize to local midnight for the selected date
      const [y, m, d] = parsed.data.scheduledDate.split('-').map((x) => parseInt(x, 10))
      const ts = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime()
      body.scheduledDate = ts
    } else if ((defaults?.scheduledDate ?? null) !== null) {
      // Explicitly clear if previously set and now empty
      body.scheduledDate = null
    }
    if (Object.keys(body).length === 0) { toast({ title: 'Brak zmian' }); return }
    setSaving(true)
    try {
      const r = await fetch(`/api/zlecenia/${orderId}/montaz`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Błąd zapisu')
  toast({ title: 'Zapisano', variant: 'success' })
  router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się zapisać'
      toast({ title: 'Błąd', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <Label>Notatka (wewnętrzna)</Label>
        <Textarea rows={4} value={values.note} onChange={(e) => setValues(v => ({ ...v, note: e.target.value }))} />
      </div>
      <div>
        <Label>m2 przed pomiarem</Label>
        <Input inputMode="numeric" value={values.preMeasurementSqm} onChange={(e) => setValues(v => ({ ...v, preMeasurementSqm: e.target.value }))} className="w-40" />
      </div>
      <div>
        <Label>Przypisz montażystę</Label>
        <select value={values.installerId || ''} onChange={(e) => setValues(v => ({ ...v, installerId: e.target.value }))} className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="">-- bez przypisania --</option>
          {installers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
      </div>
      <div>
        <Label>Planowana data</Label>
        <div className="mt-1">
          <DatePicker value={values.scheduledDate || ''} onChange={(next) => setValues(v => ({ ...v, scheduledDate: next }))} />
        </div>
      </div>
      <div>
        <button type="button" disabled={saving} onClick={save} className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10">Zapisz</button>
      </div>
    </div>
  )
}
