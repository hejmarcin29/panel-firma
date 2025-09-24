import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { clients, orders, orderNoteHistory, users } from '@/db/schema'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth-session'
import { emitDomainEvent, DomainEventTypes } from '@/domain/events'
import { eq } from 'drizzle-orm'

const bodySchema = z.object({
  clientId: z.string().uuid(),
  preMeasurementSqm: z.number().int().positive().optional(),
  note: z.string().max(2000).optional(),
  installerId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  try {
  const session = await getSession()
  const role = session?.user?.role as string | undefined
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })
    const { clientId, preMeasurementSqm, note, installerId } = parsed.data
    // verify client exists
    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1)
    if (!client) return NextResponse.json({ error: 'Klient nie istnieje' }, { status: 400 })
    // verify installer if provided
    if (installerId) {
      const [inst] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, installerId)).limit(1)
      if (!inst) return NextResponse.json({ error: 'Montażysta nie istnieje' }, { status: 400 })
      if (inst.role !== 'installer') return NextResponse.json({ error: 'Użytkownik nie jest montażystą' }, { status: 400 })
    }
    const id = randomUUID()
    await db.insert(orders).values({
      id,
      clientId,
      type: 'installation',
      status: 'awaiting_measurement',
      requiresMeasurement: true,
      installerId: installerId ?? null,
      preMeasurementSqm: preMeasurementSqm ?? null,
      internalNote: note ? note : null,
      internalNoteUpdatedAt: note ? new Date() : null,
    })
    if (note) {
      await db.insert(orderNoteHistory).values({
        id: randomUUID(),
        orderId: id,
        content: note,
  editedBy: session?.user?.email ?? null,
      })
    }
    await emitDomainEvent({
      type: DomainEventTypes.orderCreated,
  actor: session?.user?.email ?? 'system',
      entity: { type: 'order', id },
      payload: { id, clientId, type: 'installation', status: 'awaiting_measurement' },
    })
    return NextResponse.json({ id })
  } catch (err) {
    console.error('[POST /api/zlecenia/montaz] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}