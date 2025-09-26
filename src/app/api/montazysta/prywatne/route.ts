import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { and, desc, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'
import { installerPrivateNotes, installerPrivatePrefs, installerPrivateTasks } from '@/db/schema'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId || role !== 'installer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')

    const tasks = await db
      .select()
      .from(installerPrivateTasks)
      .where(orderId ? and(eq(installerPrivateTasks.userId, userId), eq(installerPrivateTasks.relatedOrderId, orderId)) : eq(installerPrivateTasks.userId, userId))
      .orderBy(desc(installerPrivateTasks.createdAt))

    const notes = await db
      .select()
      .from(installerPrivateNotes)
      .where(orderId ? and(eq(installerPrivateNotes.userId, userId), eq(installerPrivateNotes.relatedOrderId, orderId)) : eq(installerPrivateNotes.userId, userId))
      .orderBy(desc(installerPrivateNotes.createdAt))

    const [prefs] = await db.select().from(installerPrivatePrefs).where(eq(installerPrivatePrefs.userId, userId)).limit(1)

    // normalize dates to epoch ms (numbers)
    const normTasks = tasks.map(t => ({
      ...t,
      createdAt: t.createdAt instanceof Date ? t.createdAt.getTime() : (typeof t.createdAt === 'number' ? t.createdAt : new Date(t.createdAt as unknown as string).getTime()),
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.getTime() : (typeof t.updatedAt === 'number' ? t.updatedAt : new Date(t.updatedAt as unknown as string).getTime()),
      dueAt: t.dueAt == null ? null : (t.dueAt instanceof Date ? t.dueAt.getTime() : (typeof t.dueAt === 'number' ? t.dueAt : new Date(t.dueAt as unknown as string).getTime())),
    }))
    const normNotes = notes.map(n => ({
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt.getTime() : (typeof n.createdAt === 'number' ? n.createdAt : new Date(n.createdAt as unknown as string).getTime()),
    }))

    return NextResponse.json({
      tasks: normTasks,
      notes: normNotes,
      prefs: { pinnedOrderId: prefs?.pinnedOrderId ?? null }
    })
  } catch (e) {
    console.error('[GET /api/montazysta/prywatne] Error', e)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
