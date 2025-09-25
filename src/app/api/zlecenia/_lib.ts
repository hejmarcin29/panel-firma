import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { clients, orders, orderNoteHistory, type Order, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { emitDomainEvent, DomainEventTypes } from '@/domain/events'
import type { SessionLike } from '@/lib/auth-session'

const START_STATUS: Record<'delivery'|'installation', Order['status']> = {
  delivery: 'ready_to_schedule',
  installation: 'awaiting_measurement',
}

export const createOrderBodySchema = z.object({
  clientId: z.string().uuid({ message: 'Nieprawidłowy identyfikator klienta' }),
  type: z.enum(['delivery','installation']).default('installation'),
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.number().int().positive().optional(),
  installerId: z.string().uuid().optional(),
})

export async function createOrderFromBody(session: SessionLike | null, raw: unknown) {
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const parsed = createOrderBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })
  }
  const { clientId, type, note, preMeasurementSqm, installerId } = parsed.data

  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1)
  if (!client) return NextResponse.json({ error: 'Klient nie istnieje' }, { status: 400 })

  if (installerId) {
    const [inst] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, installerId)).limit(1)
    if (!inst) return NextResponse.json({ error: 'Montażysta nie istnieje' }, { status: 400 })
    if (inst.role !== 'installer') return NextResponse.json({ error: 'Użytkownik nie jest montażystą' }, { status: 400 })
  }

  const id = randomUUID()
  const status = START_STATUS[type]
  const now = new Date()

  await db.insert(orders).values({
    id,
    clientId,
    type,
    status,
    requiresMeasurement: type === 'installation',
    installerId: installerId ?? null,
    preMeasurementSqm: preMeasurementSqm ?? null,
    internalNote: note ? note : null,
    internalNoteUpdatedAt: note ? now : null,
  })

  if (note) {
    await db.insert(orderNoteHistory).values({
      id: randomUUID(),
      orderId: id,
      content: note,
      editedBy: session.user?.email ?? null,
      editedAt: now,
    })
  }

  await emitDomainEvent({
    type: DomainEventTypes.orderCreated,
    actor: session.user?.email ?? 'system',
    entity: { type: 'order', id },
    payload: { id, clientId, type, status },
  })

  return NextResponse.json({ id })
}
