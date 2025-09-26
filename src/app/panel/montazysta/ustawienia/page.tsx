import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db'
import { accounts } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import InstallerPrefs from './prefs.client'

export default async function UstawieniaMontazystyPage() {
  const session = await getSession()
  const role = session?.user?.role
  if (!role) redirect('/login')
  if (role !== 'installer') redirect('/')
  const userId = session.user?.id as string | undefined

  const isGoogleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  let isConnected = false
  if (userId) {
    const rows = await db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, 'google'))).limit(1)
    isConnected = rows.length > 0
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ustawienia montażysty</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Integracje</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border brand-border p-4 space-y-3">
            <div className="font-medium">Kalendarz Google</div>
            <p className="text-sm opacity-80">Połącz swój kalendarz Google, aby terminy montaży automatycznie pojawiały się w Twoim kalendarzu.</p>
            {!isGoogleEnabled && (
              <div className="text-sm text-amber-700 dark:text-amber-300">Integracja nieaktywna (brak konfiguracji GOOGLE_CLIENT_ID/SECRET).</div>
            )}
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <span className="text-sm">Status: <span className="font-medium">Połączono</span></span>
                  <form action="/api/integracje/google/disconnect" method="post">
                    <button className="inline-flex h-9 items-center rounded-md border px-3 text-sm" style={{ borderColor: 'var(--pp-border)' }}>Odłącz</button>
                  </form>
                </>
              ) : (
                isGoogleEnabled ? (
                  <a
                    href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent('/panel/montazysta/ustawienia')}`}
                    className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
                    style={{ borderColor: 'var(--pp-border)' }}
                  >Połącz kalendarz Google</a>
                ) : (
                  <button
                    disabled
                    className="inline-flex h-9 items-center rounded-md border px-3 text-sm opacity-60 cursor-not-allowed"
                    style={{ borderColor: 'var(--pp-border)' }}
                    title="Integracja nieaktywna"
                  >Połącz kalendarz Google</button>
                )
              )}
            </div>
            <div className="text-xs opacity-70">Po połączeniu będziesz mógł wybrać kalendarz docelowy, przypomnienia i strefę czasu.</div>
            {isConnected && (
              <div className="mt-4">
                <InstallerPrefs />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
