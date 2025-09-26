"use client"
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type Task = {
  id: string
  title: string
  description: string | null
  dueAt: number | null
  done: boolean
  relatedOrderId: string | null
  createdAt: number
  updatedAt: number
}

type Note = {
  id: string
  content: string
  relatedOrderId: string | null
  createdAt: number
}

export default function PrywatneMontazysty() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [pinnedOrderId, setPinnedOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // const [error, setError] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const r = await fetch('/api/montazysta/prywatne')
      const j = await r.json().catch(() => ({}))
      const Schema = z.object({
        tasks: z.array(z.any()),
        notes: z.array(z.any()),
        prefs: z.object({ pinnedOrderId: z.string().uuid().nullable() })
      })
      const parsed = Schema.safeParse(j)
      if (!r.ok) throw new Error(parsed.success ? 'Błąd' : 'Błąd')
      if (parsed.success) {
        setTasks(parsed.data.tasks as Task[])
        setNotes(parsed.data.notes as Note[])
        setPinnedOrderId(parsed.data.prefs.pinnedOrderId)
      }
    } catch {
      // noop; optionally show toast
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Prywatne</h1>

      {pinnedOrderId ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle>Przypięte zlecenie</CardTitle></CardHeader>
          <CardContent className="text-sm flex items-center justify-between">
            <div>Masz przypięte zlecenie: <a className="underline" href={`/zlecenia/${pinnedOrderId}`}>{pinnedOrderId.slice(0,8)}</a></div>
            <Button size="sm" variant="outline" onClick={async () => {
              await fetch('/api/montazysta/prefs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinnedOrderId: null }) })
              setPinnedOrderId(null)
            }}>Odepnij</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle>Brak przypiętego zlecenia</CardTitle></CardHeader>
          <CardContent className="text-sm opacity-70">Możesz przypiąć zlecenie ze strony szczegółów zlecenia.</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Moje zadania</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-2" onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget as HTMLFormElement)
              const title = String(fd.get('title') || '').trim()
              const description = String(fd.get('description') || '').trim()
              if (!title) return
              await fetch('/api/montazysta/zadania', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description: description || null }) })
              ;(e.currentTarget as HTMLFormElement).reset()
              reload()
            }}>
              <Input name="title" placeholder="Nowe zadanie…" />
              <Textarea name="description" placeholder="Opis (opcjonalnie)" />
              <Button type="submit" size="sm">Dodaj</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {loading ? <li>Wczytywanie…</li> : tasks.length === 0 ? <li className="opacity-70">Brak zadań.</li> : tasks.map(t => (
                <li key={t.id} className="rounded border p-2 flex items-center justify-between" style={{ borderColor: 'var(--pp-border)' }}>
                  <div>
                    <div className="font-medium">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" defaultChecked={t.done} onChange={async (e) => {
                          await fetch('/api/montazysta/zadania', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, done: e.currentTarget.checked }) })
                          reload()
                        }} />
                        {t.title}
                      </label>
                    </div>
                    {t.description ? <div className="text-xs opacity-80 mt-0.5">{t.description}</div> : null}
                    {t.relatedOrderId ? <div className="text-xs mt-1">Zlecenie: <a className="underline" href={`/zlecenia/${t.relatedOrderId}`}>{t.relatedOrderId.slice(0,8)}</a></div> : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Moje notatki</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-2" onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget as HTMLFormElement)
              const content = String(fd.get('content') || '').trim()
              if (!content) return
              await fetch('/api/montazysta/notatki', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
              ;(e.currentTarget as HTMLFormElement).reset()
              reload()
            }}>
              <Textarea name="content" placeholder="Nowa notatka…" />
              <Button type="submit" size="sm">Dodaj</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {loading ? <li>Wczytywanie…</li> : notes.length === 0 ? <li className="opacity-70">Brak notatek.</li> : notes.map(n => (
                <li key={n.id} className="rounded border p-2" style={{ borderColor: 'var(--pp-border)' }}>
                  <div>{n.content}</div>
                  {n.relatedOrderId ? <div className="text-xs mt-1">Zlecenie: <a className="underline" href={`/zlecenia/${n.relatedOrderId}`}>{n.relatedOrderId.slice(0,8)}</a></div> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
