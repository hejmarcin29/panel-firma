import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { installationSlots, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const createSchema = z.object({
  plannedAt: z.number().int().positive().nullable().optional(),
  windowStart: z.number().int().positive().nullable().optional(),
  windowEnd: z.number().int().positive().nullable().optional(),
  status: z.enum(['planned','confirmed','completed','canceled']).optional(),
  installerId: z.string().uuid().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
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

    // validate installer if provided
    if (parsed.data.installerId) {
      const [inst] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, parsed.data.installerId)).limit(1)
      if (!inst) return NextResponse.json({ error: 'Montażysta nie istnieje' }, { status: 400 })
      if (inst.role !== 'installer') return NextResponse.json({ error: 'Użytkownik nie jest montażystą' }, { status: 400 })
    }

    await db.insert(installationSlots).values({
      id: crypto.randomUUID(),
      orderId: id,
      plannedAt: toDate(parsed.data.plannedAt) ?? null,
      windowStart: toDate(parsed.data.windowStart) ?? null,
      windowEnd: toDate(parsed.data.windowEnd) ?? null,
      status: parsed.data.status ?? 'planned',
      installerId: parsed.data.installerId ?? null,
      durationMinutes: parsed.data.durationMinutes ?? null,
      note: parsed.data.note ?? null,
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/montaze] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
