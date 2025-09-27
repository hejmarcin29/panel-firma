"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BackButton } from '@/components/back-button'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toaster'
import { DatePicker } from '@/components/ui/date-picker'

type Client = { id: string; name: string }
type Installer = { id: string; name: string | null; email: string; role: string }

const schema = z.object({
  clientId: z.string().uuid({ message: 'Wybierz klienta' }),
  preMeasurementSqm: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v === '' || /^[0-9]+$/.test(v), { message: 'Tylko liczby' }),
  note: z.string().max(2000),
  installerId: z.union([z.string().uuid(), z.literal('')]),
  scheduledDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewInstallationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const sp = useSearchParams()
  const preselectedClientId = sp.get('clientId') || ''

  const [clients, setClients] = useState<Client[]>([])
  const [installers, setInstallers] = useState<Installer[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: preselectedClientId || '', preMeasurementSqm: '', note: '', installerId: '', scheduledDate: '' },
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [c, u] = await Promise.all([
          fetch('/api/klienci').then(r => r.json()),
          fetch('/api/uzytkownicy?role=installer').then(r => r.json()).catch(() => ({ users: [] })),
        ])
        setClients(c.clients || [])
        setInstallers((u.users || []).filter((x: Installer) => x.role === 'installer'))
      } catch {
        setLoadError('Błąd ładowania list')
      } finally {
        setLoadingLists(false)
      }
    })()
  }, [])

  // Keep clientId in sync if preselected
  useEffect(() => {
    if (preselectedClientId) setValue('clientId', preselectedClientId)
  }, [preselectedClientId, setValue])

  const onSubmit = async (values: FormValues) => {
    try {
      const body: Record<string, unknown> = { clientId: values.clientId }
      if (values.preMeasurementSqm && values.preMeasurementSqm.trim() !== '') body.preMeasurementSqm = parseInt(values.preMeasurementSqm, 10)
      if (values.note && values.note.trim() !== '') body.note = values.note.trim()
      if (values.installerId && values.installerId !== '') body.installerId = values.installerId
      if (values.scheduledDate && values.scheduledDate.trim() !== '') {
        const [y, m, d] = values.scheduledDate.split('-').map((x) => parseInt(x, 10))
        body.scheduledDate = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime()
      }
      const resp = await fetch('/api/zlecenia/montaz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = (await resp.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!resp.ok) throw new Error(data?.error || 'Błąd')
      toast({ title: 'Utworzono montaż', variant: 'success' })
      router.push('/')
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się utworzyć montażu'
      toast({ title: 'Błąd', description: msg, variant: 'destructive' })
    }
  }

  const clientId = watch('clientId')

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/" />
        <h1 className="text-2xl font-semibold">Dodaj montaż</h1>
      </div>
      {loadError && <div className="text-sm text-red-600">{loadError}</div>}
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {preselectedClientId ? (
          <div>
            <Label>Klient</Label>
            <div className="mt-1 h-9 w-full rounded-md border border-black/15 px-3 text-sm flex items-center dark:border-white/15">
              {clients.find(c => c.id === preselectedClientId)?.name || 'Wybrany klient'}
            </div>
            {/* Pole ukryte nie jest wymagane, bo RHF ma setValue; zostawiamy tylko podgląd */}
          </div>
        ) : (
          <div>
            <Label htmlFor="client">Klient</Label>
            <select id="client" aria-invalid={!!errors.clientId} aria-describedby={errors.clientId ? 'client-error' : undefined} {...register('clientId')} className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
              <option value="">-- wybierz klienta --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p id="client-error" className="text-xs text-red-600 mt-1">{errors.clientId.message as string}</p>}
          </div>
        )}
        <div>
          <Label htmlFor="note">Notatka Primepodloga</Label>
          <Textarea id="note" placeholder="Uwagi wewnętrzne..." className="mt-1" {...register('note')} />
          <p className="text-xs opacity-60 mt-1">Historia notatki będzie zapisywana automatycznie.</p>
        </div>
        <div>
          <Label htmlFor="scheduledDate">Planowana data montażu</Label>
          <div className="mt-1">
            <DatePicker value={watch('scheduledDate') || ''} onChange={(v) => setValue('scheduledDate', v)} />
          </div>
          <p className="text-xs opacity-60 mt-1">Opcjonalnie — bez godziny (dzień montażu).</p>
        </div>
        <div>
          <Label htmlFor="sqm">m2 przed pomiarem</Label>
          <Input id="sqm" className="mt-1 w-40" placeholder="np. 55" inputMode="numeric" {...register('preMeasurementSqm')} />
          {errors.preMeasurementSqm && <p className="text-xs text-red-600 mt-1">{errors.preMeasurementSqm.message as string}</p>}
        </div>
        <div>
          <Label htmlFor="installer">Przypisz montażystę</Label>
          <select id="installer" {...register('installerId')} className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
            <option value="">-- bez przypisania --</option>
            {installers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting || !clientId || loadingLists} className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10">Zapisz</button>
          <Link href="/" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15">Anuluj</Link>
        </div>
      </form>
    </div>
  )
}
