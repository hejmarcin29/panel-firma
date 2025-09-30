import { db } from '@/db'
import { appSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pl } from '@/i18n/pl'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const schema = z.object({
  dailyGoal: z.string().trim().regex(/^\d+$/, 'Tylko liczby').transform(v => parseInt(v,10)).refine(v => v > 0 && v <= 100, 'Podaj liczbę 1–100'),
})

async function saveAction(formData: FormData): Promise<void> {
  'use server'
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = schema.parse({ dailyGoal: String(raw.dailyGoal ?? '') })
    // upsert setting
    const key = 'daily_goal'
    const rows = await db.select({ v: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).limit(1)
    if (rows.length === 0) {
      await db.insert(appSettings).values({ key, value: String(parsed.dailyGoal) })
    } else {
      await db.update(appSettings).set({ value: String(parsed.dailyGoal) }).where(eq(appSettings.key, key))
    }
    revalidatePath('/')
    redirect('/ustawienia/cel')
  } catch (e) {
    throw e instanceof Error ? e : new Error('Błąd zapisu')
  }
}

export default async function Page() {
  const current = await db.select({ v: appSettings.value }).from(appSettings).where(eq(appSettings.key, 'daily_goal')).limit(1)
  const value = current[0]?.v ?? '2'
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="text-sm opacity-70"><Link className="hover:underline focus:underline focus:outline-none" href="/">{pl.nav.dashboard}</Link> › <Link className="hover:underline focus:underline focus:outline-none" href="/ustawienia">{pl.nav.settings}</Link> › <span>Cel dzienny</span></div>
      <h1 className="text-2xl md:text-3xl font-semibold">Cel dzienny</h1>
      <Card>
        <CardHeader>
          <CardTitle>Założenie: liczba zleceń dziennie</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveAction} className="space-y-3">
            <div>
              <label htmlFor="dailyGoal" className="block text-sm mb-1">Cel (na dzień)</label>
              <input id="dailyGoal" name="dailyGoal" defaultValue={value} className="w-40 rounded-md border px-3 py-2 bg-transparent" style={{ borderColor: 'var(--pp-border)' }} inputMode="numeric" />
              <div className="text-xs opacity-70 mt-1">Podaj ile zleceń dziennie (1–100). Dashboard pokaże wykonanie celu za 14 dni.</div>
            </div>
            <div>
              <button type="submit" className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>{pl.common.save}</button>
              <Link href="/" className="ml-3 text-sm underline">Powrót do panelu</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
