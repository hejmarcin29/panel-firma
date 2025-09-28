import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    // Minimal stub: check if order exists and pretend to trigger a sync
    const row = (await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1))[0]
    if (!row) return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 })

    // Here we would enqueue a job or call Google API. For now, mark mapping as pending or ensure record exists.
    // No-op: respond success. UI should re-fetch calendar data.
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/zlecenia/:id/sync-google] error', e)
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 })
  }
}
