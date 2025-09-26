import { redirect } from 'next/navigation'
import { db } from '@/db'
import { cooperationRules } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
const NewRuleForm = dynamic(() => import('./rule-form.client'))

export default async function CooperationRulesAdminPage() {
  const session = await getSession()
  if (session?.user?.role !== 'admin') {
    redirect('/panel/montazysta')
  }
  const rules = await db
    .select({ id: cooperationRules.id, title: cooperationRules.title, version: cooperationRules.version, isActive: cooperationRules.isActive, requiresAck: cooperationRules.requiresAck, effectiveFrom: cooperationRules.effectiveFrom, createdAt: cooperationRules.createdAt })
    .from(cooperationRules)
    .orderBy(desc(cooperationRules.version))
    .limit(50)

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70"><Link className="underline" href="/">Panel</Link> &rsaquo; <Link className="underline" href="/ustawienia">Ustawienia</Link> &rsaquo; <span>Zasady współpracy</span></div>
      <h1 className="text-2xl font-semibold">Zasady współpracy</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Opublikuj nową wersję</CardTitle></CardHeader>
        <CardContent>
          <NewRuleForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Ostatnie wersje</CardTitle></CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-sm opacity-70">Brak wersji.</div>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-white/10 rounded border border-black/10 dark:border-white/10">
              {rules.map(r => (
                <div key={r.id} className="p-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs opacity-70 mt-0.5 flex items-center gap-2">
                      <span>Wersja {r.version}</span>
                      <span>•</span>
                      <span>{r.isActive ? 'Aktywna' : 'Nieaktywna'}</span>
                      <span>•</span>
                      <span>{r.requiresAck ? 'Wymaga potwierdzenia' : 'Bez potwierdzenia'}</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-70">
                    Utworzono: {r.createdAt ? new Date(r.createdAt as unknown as number).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
