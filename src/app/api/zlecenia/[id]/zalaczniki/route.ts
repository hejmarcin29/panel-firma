import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth-session'
import { db } from '@/db'
import { orderAttachments, orders } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = session.user?.role
    if (!role || (role !== 'admin' && role !== 'manager' && role !== 'installer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    // ensure order exists
    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!ord) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 })

    const rows = await db.select().from(orderAttachments).where(eq(orderAttachments.orderId, id))
    return NextResponse.json({ items: rows })
  } catch (err) {
    console.error('[GET /api/zlecenia/:id/zalaczniki] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

const finalizeSchema = z.object({
  key: z.string().min(1),
  publicUrl: z.string().url(),
  category: z.enum(['invoices','installs','contracts','protocols','other']),
  mime: z.string().min(1).optional().nullable(),
  size: z.number().int().nonnegative().optional().nullable(),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = session.user?.role
    const actorId = session.user?.id ?? null
    if (!role || (role !== 'admin' && role !== 'manager' && role !== 'installer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await ctx.params
    // ensure order exists
    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!ord) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 })

    const json = await req.json().catch(() => null)
    const parsed = finalizeSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })
    }

    const now = new Date()
    const idNew = crypto.randomUUID()
    await db.insert(orderAttachments).values({
      id: idNew,
      orderId: id,
      category: parsed.data.category,
      title: null,
      version: 1,
      mime: parsed.data.mime ?? null,
      size: parsed.data.size ?? null,
      key: parsed.data.key,
      publicUrl: parsed.data.publicUrl,
      createdAt: now,
    })

    // Revalidate order page and list
    revalidatePath(`/zlecenia/${id}`)
    revalidatePath('/zlecenia')
    return NextResponse.json({ ok: true, id: idNew })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/zalaczniki] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
