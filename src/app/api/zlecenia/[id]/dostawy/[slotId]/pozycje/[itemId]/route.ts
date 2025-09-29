import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { deliveryItems, deliverySlots } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const patchSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  sqm: z.union([z.string(), z.number()]).optional(),
  packs: z.union([z.string(), z.number()]).optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; slotId: string; itemId: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'manager')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, slotId, itemId } = await ctx.params
    // Verify slot belongs to order
    const [slot] = await db.select({ id: deliverySlots.id }).from(deliverySlots).where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.orderId, id))).limit(1)
    if (!slot) return NextResponse.json({ error: 'Nie znaleziono slotu' }, { status: 404 })

    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const toSqmCenti = (v: unknown) => {
      if (v == null || v === '') return undefined // undefined = nie zmieniaj
      const s = String(v).replace(',', '.').trim()
      const num = Number(s)
      return Number.isFinite(num) ? Math.round(num * 100) : null
    }
    const toInt = (v: unknown) => {
      if (v == null || v === '') return undefined
      const num = Number(String(v).trim())
      return Number.isFinite(num) ? Math.round(num) : null
    }

    const update: Record<string, unknown> = {}
    if (parsed.data.name != null) update.name = parsed.data.name.trim()
    const sqmC = toSqmCenti(parsed.data.sqm)
    if (sqmC !== undefined) update.sqmCenti = sqmC
    const packs = toInt(parsed.data.packs)
    if (packs !== undefined) update.packs = packs

    if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

    await db.update(deliveryItems).set(update).where(and(eq(deliveryItems.id, itemId), eq(deliveryItems.slotId, slotId)))
    revalidatePath(`/zlecenia/${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/zlecenia/:id/dostawy/:slotId/pozycje/:itemId] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; slotId: string; itemId: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'manager')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, slotId, itemId } = await ctx.params
    // Verify slot belongs to order
    const [slot] = await db.select({ id: deliverySlots.id }).from(deliverySlots).where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.orderId, id))).limit(1)
    if (!slot) return NextResponse.json({ error: 'Nie znaleziono slotu' }, { status: 404 })

    await db.delete(deliveryItems).where(and(eq(deliveryItems.id, itemId), eq(deliveryItems.slotId, slotId)))
    revalidatePath(`/zlecenia/${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/zlecenia/:id/dostawy/:slotId/pozycje/:itemId] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
