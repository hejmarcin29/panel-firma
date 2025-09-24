import { NextResponse } from 'next/server'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { getSession } from '@/lib/auth-session'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
  const session = await getSession()
  const user = session?.user
    if (!session || user?.role !== 'installer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!user?.id) return NextResponse.json({ orders: [] })
    const ordersList = await db
      .select({ id: orders.id, clientId: orders.clientId, status: orders.status, preMeasurementSqm: orders.preMeasurementSqm, scheduledDate: orders.scheduledDate, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.installerId, user.id))
      .orderBy(desc(orders.createdAt))
    return NextResponse.json({ orders: ordersList })
  } catch (err) {
    console.error('[GET /api/montazysta/moje] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}