import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { installerPrivatePrefs, orders } from '@/db/schema'
import { getSession } from '@/lib/auth-session'

const BodySchema = z.object({
  pinnedOrderId: z.string().uuid().nullable(),
})

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId || role !== 'installer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne dane', issues: parsed.error.issues }, { status: 400 })
    // if pinning to a specific order, ensure it's assigned to this installer
    if (parsed.data.pinnedOrderId) {
      const [own] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, parsed.data.pinnedOrderId)).limit(1)
      if (!own) return NextResponse.json({ error: 'Zlecenie nie istnieje' }, { status: 404 })
      // Optional: ensure assigned installer
      // We do a second select to avoid selecting nullable installerId in the first
      const [assigned] = await db.select({ installerId: orders.installerId }).from(orders).where(eq(orders.id, parsed.data.pinnedOrderId)).limit(1)
      if (!assigned || assigned.installerId !== userId) return NextResponse.json({ error: 'To zlecenie nie jest do Ciebie przypisane' }, { status: 403 })
    }
    // upsert
    const [existing] = await db.select().from(installerPrivatePrefs).where(eq(installerPrivatePrefs.userId, userId)).limit(1)
    if (existing) {
      await db.update(installerPrivatePrefs).set({ pinnedOrderId: parsed.data.pinnedOrderId ?? null, updatedAt: new Date() }).where(eq(installerPrivatePrefs.userId, userId))
    } else {
      await db.insert(installerPrivatePrefs).values({ userId, pinnedOrderId: parsed.data.pinnedOrderId ?? null })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/montazysta/prefs] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
