import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { installationSlots, users } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const patchSchema = z.object({
  plannedAt: z.number().int().positive().nullable().optional(),
  windowStart: z.number().int().positive().nullable().optional(),
  windowEnd: z.number().int().positive().nullable().optional(),
  status: z.enum(['planned','confirmed','completed','canceled']).optional(),
  installerId: z.string().uuid().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
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
    if ('durationMinutes' in parsed.data) update.durationMinutes = parsed.data.durationMinutes ?? null
    if ('note' in parsed.data) update.note = parsed.data.note ?? null

    if ('installerId' in parsed.data) {
      if (parsed.data.installerId === null) update.installerId = null
      else {
        const [inst] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, parsed.data.installerId)).limit(1)
        if (!inst) return NextResponse.json({ error: 'Montażysta nie istnieje' }, { status: 400 })
        if (inst.role !== 'installer') return NextResponse.json({ error: 'Użytkownik nie jest montażystą' }, { status: 400 })
        update.installerId = parsed.data.installerId
      }
    }

    await db.update(installationSlots).set(update).where(and(eq(installationSlots.id, slotId), eq(installationSlots.orderId, id)))

    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/zlecenia/:id/montaze/:slotId] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
