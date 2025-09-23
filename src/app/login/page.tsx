"use client"
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Podaj poprawny email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Logowanie</h1>
      <form className="space-y-4" onSubmit={handleSubmit(async ({ email, password }) => {
        const res = await signIn('credentials', { email, password, redirect: true, callbackUrl: '/' })
        if (res && (res as any).error) {
          setError('password', { type: 'manual', message: 'Błędny email lub hasło' })
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
        </div>
        <Button type="submit" disabled={isSubmitting}>Zaloguj</Button>
      </form>
    </div>
  )
}
