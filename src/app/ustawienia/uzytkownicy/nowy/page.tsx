"use client"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Wymagane').max(120).optional(),
  password: z.string().min(12, 'Minimum 12 znaków'),
  role: z.enum(['admin','installer','architect','manager']),
})

export default function NewUserPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', password: '', role: 'installer' },
  })

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <div className="text-sm opacity-70"><Link className="underline" href="/">Panel</Link> &rsaquo; <Link className="underline" href="/ustawienia">Ustawienia</Link> &rsaquo; <Link className="underline" href="/ustawienia/uzytkownicy">Użytkownicy</Link> &rsaquo; <span>Nowy</span></div>
      <h1 className="text-2xl font-semibold">Dodaj użytkownika</h1>
      <form className="space-y-4" onSubmit={handleSubmit(async (values) => {
        try {
          const resp = await fetch('/api/uzytkownicy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
          const data = await resp.json().catch(() => ({}))
          if (!resp.ok) throw new Error(data?.error || 'Błąd')
          toast({ title: 'Utworzono użytkownika', variant: 'success' })
          reset()
          router.push('/ustawienia/uzytkownicy')
          router.refresh()
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Błąd'
          toast({ title: 'Błąd', description: msg, variant: 'destructive' })
        }
      })}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <p id="email-err" className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Imię i nazwisko</Label>
          <Input type="text" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
          {errors.name && <p id="name-err" className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Hasło</Label>
          <Input type="password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-err' : undefined} />
          {errors.password && <p id="password-err" className="text-sm text-red-600">{errors.password.message}</p>}
          <p className="text-xs opacity-70">Minimum 12 znaków. Hasło będzie hashowane (Argon2id).</p>
        </div>
        <div className="space-y-2">
          <Label>Rola</Label>
          <select className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" {...register('role')}>
            <option value="installer">Montażysta</option>
            <option value="admin">Admin</option>
            <option value="architect">Architekt</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>Zapisz</Button>
          <Link href="/ustawienia/uzytkownicy" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15">Anuluj</Link>
        </div>
      </form>
    </div>
  )
}
