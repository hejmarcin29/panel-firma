import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, orders } from '@/db/schema'
import { getSession } from '@/lib/auth-session'
import { emitDomainEvent, DomainEventTypes } from '@/domain/events'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

interface SessionUser { user?: { email?: string | null, role?: string | null } | null }

const bodySchema = z.object({
  outcome: z.enum(['won','lost']),
  reasonCode: z.string().trim().min(1).optional().nullable(),
  reasonNote: z.string().trim().min(1).optional().nullable(),
})

// POST /api/zlecenia/:id/wynik
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    const role = (session as SessionUser)?.user?.role ?? null
    const actor = (session as SessionUser)?.user?.email ?? null
    if (role !== 'admin') return NextResponse.json({ error: 'Tylko admin' }, { status: 403 })

    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const { id } = await params
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!order) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 })
    if (order.outcome) return NextResponse.json({ error: 'Wynik już ustawiony' }, { status: 409 })

    const now = new Date()
    await db.update(orders).set({
      outcome: parsed.data.outcome,
      outcomeAt: now,
      outcomeReasonCode: parsed.data.reasonCode ?? null,
      outcomeReasonNote: parsed.data.reasonNote ?? null,
    }).where(eq(orders.id, id))

    const rows = await db
      .select({ clientNo: clients.clientNo, orderNo: orders.orderNo })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))
      .limit(1)
    const withNo = rows[0]

    await emitDomainEvent({
      type: parsed.data.outcome === 'won' ? DomainEventTypes.orderWon : DomainEventTypes.orderLost,
      actor,
      entity: { type: 'order', id },
      payload: {
        id,
        outcome: parsed.data.outcome,
        clientNo: withNo?.clientNo ?? null,
        orderNo: withNo?.orderNo ?? null,
        reasonCode: parsed.data.reasonCode ?? null,
        reasonNote: parsed.data.reasonNote ?? null,
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/wynik] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
