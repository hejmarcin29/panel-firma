import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { installerPrivateTasks } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  done: z.boolean().optional(),
  dueAt: z.number().int().positive().nullable().optional(),
  userId: z.string().uuid().optional(), // admin-only reassignment
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    const role = session.user.role
    const me = session.user.id
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne dane', issues: parsed.error.issues }, { status: 400 })

    const update: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.title !== undefined) update.title = parsed.data.title
    if (parsed.data.description !== undefined) update.description = parsed.data.description
    if (parsed.data.done !== undefined) update.done = parsed.data.done
    if (parsed.data.dueAt !== undefined) update.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
    if (parsed.data.userId !== undefined) {
      if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      update.userId = parsed.data.userId
    }

    if (role === 'admin') {
      await db.update(installerPrivateTasks).set(update).where(eq(installerPrivateTasks.id, id))
    } else {
      await db.update(installerPrivateTasks).set(update).where(and(eq(installerPrivateTasks.id, id), eq(installerPrivateTasks.userId, me)))
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/zadania/:id] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    const role = session.user.role
    const me = session.user.id
    const { id } = await ctx.params
    if (role === 'admin') {
      await db.delete(installerPrivateTasks).where(eq(installerPrivateTasks.id, id))
    } else {
      await db.delete(installerPrivateTasks).where(and(eq(installerPrivateTasks.id, id), eq(installerPrivateTasks.userId, me)))
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/zadania/:id] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
