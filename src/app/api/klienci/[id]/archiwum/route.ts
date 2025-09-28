import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, orders } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'
import { emitDomainEvent, DomainEventTypes } from '@/domain/events'

// POST /api/klienci/:id/archiwum → archiwizuj klienta + wszystkie jego zlecenia
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role as string | undefined
    if (!session || !['admin','manager'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await ctx.params
    const now = new Date()
    db.transaction((tx) => {
      tx.update(clients).set({ archivedAt: now }).where(eq(clients.id, id)).run()
      // Even if client already archived, continue idempotently to archive orders
      tx.update(orders).set({ archivedAt: now }).where(and(eq(orders.clientId, id), isNull(orders.archivedAt))).run()
    })
    try {
      await emitDomainEvent({ type: DomainEventTypes.clientArchived, actor: session.user?.email ?? null, entity: { type: 'client', id }, payload: { id } })
    } catch (e) {
      console.warn('[client.archived] event emit failed (non-fatal)', e)
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/klienci/:id/archiwum] Error', err)
    const msg = err instanceof Error ? err.message : 'Błąd serwera'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/klienci/:id/archiwum → przywróć klienta (+ wszystkie jego zlecenia)
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role as string | undefined
    if (!session || !['admin','manager'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await ctx.params
    db.transaction((tx) => {
      tx.update(clients).set({ archivedAt: null }).where(eq(clients.id, id)).run()
      tx.update(orders).set({ archivedAt: null }).where(eq(orders.clientId, id)).run()
    })
    try {
      await emitDomainEvent({ type: DomainEventTypes.clientUnarchived, actor: session.user?.email ?? null, entity: { type: 'client', id }, payload: { id } })
    } catch (e) {
      console.warn('[client.unarchived] event emit failed (non-fatal)', e)
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[DELETE /api/klienci/:id/archiwum] Error', err)
    const msg = err instanceof Error ? err.message : 'Błąd serwera'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
