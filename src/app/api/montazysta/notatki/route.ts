import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '@/db'
import { installerPrivateNotes, orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const BodySchema = z.object({
  content: z.string().min(1),
  relatedOrderId: z.string().uuid().nullable().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId || role !== 'installer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne dane', issues: parsed.error.issues }, { status: 400 })
    // validate relatedOrderId belongs to installer if provided
    if (parsed.data.relatedOrderId) {
      const [assigned] = await db.select({ installerId: orders.installerId }).from(orders).where(eq(orders.id, parsed.data.relatedOrderId)).limit(1)
      if (!assigned) return NextResponse.json({ error: 'Zlecenie nie istnieje' }, { status: 404 })
      if (assigned.installerId !== userId) return NextResponse.json({ error: 'To zlecenie nie jest do Ciebie przypisane' }, { status: 403 })
    }
    const id = randomUUID()
    await db.insert(installerPrivateNotes).values({
      id,
      userId,
      content: parsed.data.content,
      relatedOrderId: parsed.data.relatedOrderId ?? null,
    })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error('[POST /api/montazysta/notatki] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
