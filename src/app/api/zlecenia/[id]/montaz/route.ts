import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { orders, orderNoteHistory, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

// PATCH body can include any subset of fields below
const bodySchema = z.object({
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.number().int().positive().optional(),
  installerId: z.string().uuid().nullable().optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role as string | undefined
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    const raw = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const update: Record<string, unknown> = {}
    const now = new Date()
    if (typeof parsed.data.preMeasurementSqm === 'number') {
      update.preMeasurementSqm = parsed.data.preMeasurementSqm
    }
    if (parsed.data.installerId !== undefined) {
      if (parsed.data.installerId === null) {
        update.installerId = null
      } else {
        // verify installer role
        const [inst] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, parsed.data.installerId)).limit(1)
        if (!inst) return NextResponse.json({ error: 'Montażysta nie istnieje' }, { status: 400 })
        if (inst.role !== 'installer') return NextResponse.json({ error: 'Użytkownik nie jest montażystą' }, { status: 400 })
        update.installerId = parsed.data.installerId
      }
    }
    if (typeof parsed.data.note === 'string') {
      update.internalNote = parsed.data.note
      update.internalNoteUpdatedAt = now
      await db.insert(orderNoteHistory).values({
        id: crypto.randomUUID(),
        orderId: id,
        content: parsed.data.note,
        editedBy: session?.user?.email ?? null,
        editedAt: now,
      })
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })
    await db.update(orders).set(update).where(eq(orders.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/zlecenia/:id/montaz] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}