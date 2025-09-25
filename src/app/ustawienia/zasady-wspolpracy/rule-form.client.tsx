"use client"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'

const schema = z.object({
  title: z.string().min(1, 'Wymagane'),
  contentMd: z.string().min(1, 'Wymagane'),
  version: z.coerce.number().int().positive('> 0'),
  isActive: z.enum(['true','false']).default('true'),
  requiresAck: z.enum(['true','false']).default('true'),
  audience: z.array(z.enum(['admin','installer','architect','manager'])).default(['installer']),
  effectiveFrom: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewRuleForm() {
  const { toast } = useToast()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', contentMd: '', version: 1, isActive: 'true', requiresAck: 'true', audience: ['installer'], effectiveFrom: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const body = {
        title: values.title,
        contentMd: values.contentMd,
        version: values.version,
        isActive: values.isActive === 'true',
        requiresAck: values.requiresAck === 'true',
        audience: values.audience,
        effectiveFrom: values.effectiveFrom && values.effectiveFrom.trim() ? new Date(values.effectiveFrom).getTime() : undefined,
      }
      const resp = await fetch('/api/zasady-wspolpracy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error || 'Błąd')
      toast({ title: 'Opublikowano wersję zasad', variant: 'success' })
      reset()
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd'
      toast({ title: 'Błąd', description: msg, variant: 'destructive' })
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Tytuł</Label>
        <Input type="text" {...register('title')} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-err' : undefined} />
        {errors.title && <p id="title-err" className="text-sm text-red-600">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Treść (Markdown)</Label>
        <textarea className="min-h-40 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15" {...register('contentMd')} aria-invalid={!!errors.contentMd} aria-describedby={errors.contentMd ? 'content-err' : undefined} />
        {errors.contentMd && <p id="content-err" className="text-sm text-red-600">{errors.contentMd.message}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Wersja</Label>
          <Input type="number" min={1} step={1} {...register('version', { valueAsNumber: true })} aria-invalid={!!errors.version} aria-describedby={errors.version ? 'version-err' : undefined} />
          {errors.version && <p id="version-err" className="text-sm text-red-600">{errors.version.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <select className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" {...register('isActive')}>
            <option value="true">Aktywna</option>
            <option value="false">Nieaktywna</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Potwierdzenie</Label>
          <select className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" {...register('requiresAck')}>
            <option value="true">Wymagane</option>
            <option value="false">Nie wymagane</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Adresaci</Label>
          <div className="flex flex-wrap gap-3 text-sm">
            {(['installer','admin','architect','manager'] as const).map(role => (
              <label key={role} className="inline-flex items-center gap-2">
                <input type="checkbox" value={role} {...register('audience')} />
                <span>{role}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Obowiązuje od (opcjonalnie)</Label>
          <Input type="datetime-local" {...register('effectiveFrom')} />
          <p className="text-xs opacity-70">Pozostaw puste, aby obowiązywało od razu.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>Publikuj</Button>
      </div>
    </form>
  )
}
