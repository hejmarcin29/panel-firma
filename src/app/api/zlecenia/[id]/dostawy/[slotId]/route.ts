import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { deliverySlots } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const patchSchema = z.object({
  plannedAt: z.number().int().positive().nullable().optional(),
  windowStart: z.number().int().positive().nullable().optional(),
  windowEnd: z.number().int().positive().nullable().optional(),
  status: z.enum(['planned','confirmed','completed','canceled']).optional(),
  carrier: z.string().max(200).nullable().optional(),
  trackingNo: z.string().max(200).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; slotId: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'manager')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, slotId } = await ctx.params
    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const toDate = (v: number | null | undefined) => v == null ? null : new Date(v)
    const update: Record<string, unknown> = { updatedAt: new Date() }
    if ('plannedAt' in parsed.data) update.plannedAt = toDate(parsed.data.plannedAt)
    if ('windowStart' in parsed.data) update.windowStart = toDate(parsed.data.windowStart)
    if ('windowEnd' in parsed.data) update.windowEnd = toDate(parsed.data.windowEnd)
    if ('status' in parsed.data) update.status = parsed.data.status
    if ('carrier' in parsed.data) update.carrier = parsed.data.carrier ?? null
    if ('trackingNo' in parsed.data) update.trackingNo = parsed.data.trackingNo ?? null
    if ('note' in parsed.data) update.note = parsed.data.note ?? null

    await db.update(deliverySlots).set(update).where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.orderId, id)))

    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/zlecenia/:id/dostawy/:slotId] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
