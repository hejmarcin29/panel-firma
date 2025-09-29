import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { deliveryItems, deliverySlots } from '@/db/schema'
import { getSession } from '@/lib/auth-session'
import { desc, eq } from 'drizzle-orm'

const createSchema = z.object({
  plannedAt: z.number().int().positive().nullable().optional(),
  windowStart: z.number().int().positive().nullable().optional(),
  windowEnd: z.number().int().positive().nullable().optional(),
  status: z.enum(['planned','confirmed','completed','canceled']).optional(),
  carrier: z.string().max(200).nullable().optional(),
  trackingNo: z.string().max(200).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  items: z.array(z.object({ name: z.string().min(1), sqm: z.string().optional(), packs: z.string().optional() })).optional(),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'manager')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await ctx.params
    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const now = new Date()
    const toDate = (v: number | null | undefined) => v == null ? null : new Date(v)

    const slotId = crypto.randomUUID()
    await db.insert(deliverySlots).values({
      id: slotId,
      orderId: id,
      plannedAt: toDate(parsed.data.plannedAt) ?? null,
      windowStart: toDate(parsed.data.windowStart) ?? null,
      windowEnd: toDate(parsed.data.windowEnd) ?? null,
      status: parsed.data.status ?? 'planned',
      carrier: parsed.data.carrier ?? null,
      trackingNo: parsed.data.trackingNo ?? null,
      note: parsed.data.note ?? null,
      createdAt: now,
      updatedAt: now,
    })

    if (parsed.data.items && parsed.data.items.length) {
      const rows = parsed.data.items.map((it) => ({
        id: crypto.randomUUID(),
        slotId,
        name: it.name,
        sqmCenti: (() => {
          const v = (it.sqm ?? '').replace(',', '.').trim()
          if (!v) return null
          const num = Number(v)
          return Number.isFinite(num) ? Math.round(num * 100) : null
        })(),
        packs: (() => {
          const p = (it.packs ?? '').trim()
          if (!p) return null
          const num = Number(p)
          return Number.isFinite(num) ? Math.round(num) : null
        })(),
        createdAt: now,
      }))
      if (rows.length) await db.insert(deliveryItems).values(rows)
    }

    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/dostawy] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

// GET /api/zlecenia/:id/dostawy — lista slotów dostaw dla zlecenia
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const rows = await db
      .select({
        id: deliverySlots.id,
        plannedAt: deliverySlots.plannedAt,
        windowStart: deliverySlots.windowStart,
        windowEnd: deliverySlots.windowEnd,
        status: deliverySlots.status,
        carrier: deliverySlots.carrier,
        trackingNo: deliverySlots.trackingNo,
        note: deliverySlots.note,
      })
      .from(deliverySlots)
      .where(eq(deliverySlots.orderId, id))
      .orderBy(desc(deliverySlots.plannedAt))
    return NextResponse.json({ slots: rows })
  } catch (err) {
    console.error('[GET /api/zlecenia/:id/dostawy] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
