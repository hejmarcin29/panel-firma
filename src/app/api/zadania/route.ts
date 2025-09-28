import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { installerPrivateTasks, users } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth-session'

const listQuery = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['open','done']).optional(),
  orderId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  dueAt: z.number().int().positive().nullable().optional(),
  relatedOrderId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid().optional(), // admin-only; dla instalatora ignorowane
})

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    const role = session.user.role
    const me = session.user.id
    const url = new URL(req.url)
    const raw = Object.fromEntries(url.searchParams.entries())
    const parsed = listQuery.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne parametry', issues: parsed.error.issues }, { status: 400 })
    const { userId, status, orderId, limit } = parsed.data

  const ownerId = role === 'admin' ? (userId || me) : me

  // Build query
  const where: SQL[] = [eq(installerPrivateTasks.userId, ownerId as string) as unknown as SQL]
  if (status === 'open') where.push(eq(installerPrivateTasks.done, false) as unknown as SQL)
  if (status === 'done') where.push(eq(installerPrivateTasks.done, true) as unknown as SQL)
  if (orderId) where.push(eq(installerPrivateTasks.relatedOrderId, orderId) as unknown as SQL)

    const rows = await db
      .select()
      .from(installerPrivateTasks)
      .where(where.length === 1 ? where[0] : and(...where))
      .orderBy(desc(installerPrivateTasks.createdAt))
      .limit(limit ?? 200)

    const tasks = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      done: Boolean(r.done),
      dueAt: r.dueAt,
      relatedOrderId: r.relatedOrderId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userId: r.userId,
    }))
    return NextResponse.json({ tasks })
  } catch (e) {
    console.error('[GET /api/zadania] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    const me = session.user.id
    const role = session.user.role
    const body = await req.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne dane', issues: parsed.error.issues }, { status: 400 })

    let targetUserId = me
    if (role === 'admin' && parsed.data.userId) {
      // verify user exists
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, parsed.data.userId)).limit(1)
      if (!u) return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 400 })
      targetUserId = parsed.data.userId
    }

    const id = randomUUID()
    await db.insert(installerPrivateTasks).values({
      id,
      userId: targetUserId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      relatedOrderId: parsed.data.relatedOrderId ?? null,
    })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error('[POST /api/zadania] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
