import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function IntegracjeAdminPage() {
  const session = await getSession()
  const role = session?.user?.role
  if (!role) redirect('/login')
  if (role !== 'admin' && role !== 'manager') redirect('/')

  const rows = await db
    .select({ userId: accounts.userId, email: users.email, name: users.name })
    .from(accounts)
    .leftJoin(users, eq(accounts.userId, users.id))
    .where(eq(accounts.provider, 'google'))
    .limit(200)

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Integracje</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Kalendarz Google</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm opacity-80">Plan: montażysta może połączyć własny kalendarz Google (OAuth), a terminy przypisanych montaży będą automatycznie tworzone/aktualizowane w jego kalendarzu.</p>
          <ul className="list-disc pl-5 text-sm mt-3 opacity-80">
            <li>Bez zmiany sposobu logowania – łączenie konta tylko do kalendarza.</li>
            <li>Zakres: tylko &quot;events&quot; (tworzenie/aktualizacja/usuwanie wydarzeń).</li>
            <li>Preferencje: wybór kalendarza, przypomnienia, strefa czasu.</li>
          </ul>
          <div className="mt-4 rounded border p-3" style={{ borderColor: 'var(--pp-border)' }}>
            <div className="font-medium mb-2">Połączeni użytkownicy</div>
            {rows.length === 0 ? (
              <div className="text-sm opacity-70">Brak połączeń.</div>
            ) : (
              <ul className="text-sm space-y-1">
                {rows.map((r) => (
                  <li key={r.userId} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                    <span>{r.name || r.email || r.userId}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
