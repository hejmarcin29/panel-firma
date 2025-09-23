"use client"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Minimum 12 znaków'),
})

export default function SetupPage() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-2xl font-semibold">Ustaw administratora</h1>
      <p className="mb-6 text-sm opacity-70">Formularz zadziała tylko, jeśli w bazie nie ma żadnych użytkowników.</p>
      <form className="space-y-4" onSubmit={handleSubmit(async ({ email, password }) => {
        try {
          const resp = await fetch('/api/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error(data?.message || 'Błąd');
          toast({ title: 'Utworzono admina', variant: 'success' });
          // Opcjonalnie: przekierowanie do logowania
          // router.push('/login')
        } catch (err: any) {
          toast({ title: 'Błąd', description: err?.message || 'Wystąpił problem z połączeniem', variant: 'destructive' });
        }
      })}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Hasło</Label>
          <Input type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          <p className="text-xs opacity-70">Minimum 12 znaków. Hasło zostanie zhashowane (Argon2id).</p>
        </div>
        <Button type="submit" disabled={isSubmitting}>Utwórz admina</Button>
      </form>
    </div>
  )
}
