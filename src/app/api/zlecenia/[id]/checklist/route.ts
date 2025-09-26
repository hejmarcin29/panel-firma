import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { orderChecklistItems, orders } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'
import { emitDomainEvent, DomainEventTypes } from '@/domain/events'
import { revalidatePath } from 'next/cache'

const bodySchema = z.object({ key: z.string().min(1), done: z.boolean() })

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const role = (session as any)?.user?.role as string | undefined
    const actorEmail = (session as any)?.user?.email ?? null
    const actorId = (session as any)?.user?.id ?? null
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!order) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 })
    if (order.outcome) return NextResponse.json({ error: 'Zamknięte zlecenie' }, { status: 409 })

    // RBAC minimal: admin/manager – pełny; installer – może zaznaczać pozycje operacyjne (łagodnie: pozwalamy na razie wszystkie, ograniczymy później)
    if (role !== 'admin' && role !== 'manager' && role !== 'installer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date()
    const kind = order.type
    // Upsert/toggle
    const [existing] = await db
      .select({ id: orderChecklistItems.id })
      .from(orderChecklistItems)
      .where(and(eq(orderChecklistItems.orderId, id), eq(orderChecklistItems.key, parsed.data.key)))
      .limit(1)

    if (!existing) {
      await db.insert(orderChecklistItems).values({
        id: crypto.randomUUID(), orderId: id, kind, key: parsed.data.key, label: null,
        done: parsed.data.done, doneAt: parsed.data.done ? now : null, doneBy: parsed.data.done ? actorId : null,
        createdAt: now, updatedAt: now,
      })
    } else {
      await db.update(orderChecklistItems).set({
        done: parsed.data.done,
        doneAt: parsed.data.done ? now : null,
        doneBy: parsed.data.done ? actorId : null,
        updatedAt: now,
      }).where(eq(orderChecklistItems.id, existing.id))
    }

    await emitDomainEvent({
      type: DomainEventTypes.orderChecklistToggled,
      actor: actorEmail,
      entity: { type: 'order', id },
      payload: { id, key: parsed.data.key, done: parsed.data.done, actorId },
    })

    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/checklist] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
