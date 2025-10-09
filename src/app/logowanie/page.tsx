import { redirect } from 'next/navigation'

import { getCurrentSession, hasAdminUser } from '@/lib/auth'

import { LoginForm } from './login-form'

export const metadata = {
  title: 'Logowanie',
  description: 'Uzyskaj dostęp do panelu zarządzania firmą po uwierzytelnieniu.',
}

export default async function LoginPage() {
  const [session, adminExists] = await Promise.all([getCurrentSession(), hasAdminUser()])
  if (!adminExists) {
    redirect('/setup')
  }
  if (session) {
    redirect('/zlecenia')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.1),_transparent_45%)]" />
      <section className="flex w-full max-w-6xl flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            Panel zarządzania
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Witaj w centrum operacyjnym
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            Zaloguj się, aby zarządzać zleceniami, montażami, dostawami i współpracą z partnerami. 
            Panel dostępny dla administratorów, montażystów i architektów.
          </p>
        </div>

        <LoginForm className="mt-4" />

        <p className="max-w-md text-xs text-muted-foreground">
          Masz problem z logowaniem? Skontaktuj się z administratorem w celu resetu hasła lub nadania uprawnień.
        </p>
      </section>
    </main>
  )
}
