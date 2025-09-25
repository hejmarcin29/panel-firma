import { NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, clients, users } from '@/db/schema'
import { getSession } from '@/lib/auth-session'
import { and, desc, eq, isNull, isNotNull } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') === 'all' ? 'all' : 'active'
    const installerId = url.searchParams.get('installerId') || undefined
    const session = await getSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Bazowa kondycja: zlecenia montażu przypisane do jakiegokolwiek montażysty
    let condition = and(
      eq(orders.type, 'installation'),
      isNotNull(orders.installerId),
    )
    if (scope === 'active') {
      condition = and(condition, isNull(orders.archivedAt), isNull(orders.outcome))
    }
    if (installerId) {
      condition = and(condition, eq(orders.installerId, installerId))
    }

    const list = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        clientName: clients.name,
        installerId: orders.installerId,
        installerEmail: users.email,
        installerName: users.name,
        status: orders.status,
        preMeasurementSqm: orders.preMeasurementSqm,
        scheduledDate: orders.scheduledDate,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .leftJoin(users, eq(orders.installerId, users.id))
      .where(condition)
      .orderBy(desc(orders.createdAt))

    const normalized = list.map((o) => ({
      ...o,
      createdAt: o.createdAt instanceof Date ? o.createdAt.getTime() : (typeof o.createdAt === 'number' ? o.createdAt : new Date(o.createdAt as unknown as string).getTime()),
      scheduledDate: o.scheduledDate == null
        ? null
        : (o.scheduledDate instanceof Date ? o.scheduledDate.getTime() : (typeof o.scheduledDate === 'number' ? o.scheduledDate : new Date(o.scheduledDate as unknown as string).getTime())),
    }))

    return NextResponse.json({ orders: normalized })
  } catch (err) {
    console.error('[GET /api/montaze/zlecone] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
