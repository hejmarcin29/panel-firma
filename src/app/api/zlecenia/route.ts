import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, type Order, orderChecklistItems } from '@/db/schema';
import { getSession } from '@/lib/auth-session';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm'
import { createOrderFromBody } from './_lib';
import { z } from 'zod'

// GET /api/zlecenia?clientId=...
const listQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  type: z.enum(['delivery','installation']).optional(),
  status: z.enum(['awaiting_measurement','ready_to_schedule','scheduled','completed','cancelled']).optional(),
  installerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  withFlags: z.union([z.literal('1'), z.literal('true')]).optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries())
    const parsed = listQuerySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Błędne parametry', issues: parsed.error.issues }, { status: 400 })
    const { clientId, type, status, installerId, limit, withFlags } = parsed.data
    const clauses: SQL[] = []
    if (clientId) clauses.push(eq(orders.clientId, clientId) as unknown as SQL)
    if (type) clauses.push(eq(orders.type, type) as unknown as SQL)
    if (status) clauses.push(eq(orders.status, status) as unknown as SQL)
    if (installerId) clauses.push(eq(orders.installerId, installerId) as unknown as SQL)
    const whereExpr: SQL | undefined = clauses.length === 0 ? undefined : (clauses.length === 1 ? clauses[0] : and(...clauses))
  const base = db.select().from(orders)
    const query = whereExpr ? base.where(whereExpr) : base
  const list: Order[] = await query.orderBy(desc(orders.createdAt)).limit(limit ?? 200)

    if (withFlags) {
      const ids = list.map(o => o.id)
      if (ids.length === 0) return NextResponse.json({ orders: [] })
      const items = await db
        .select({ orderId: orderChecklistItems.orderId, key: orderChecklistItems.key, done: orderChecklistItems.done })
        .from(orderChecklistItems)
        .where(inArray(orderChecklistItems.orderId, ids))
      const byOrder = new Map<string, Record<string, boolean>>()
      for (const it of items) {
        const m = byOrder.get(it.orderId) ?? {}
        m[it.key] = Boolean(it.done)
        byOrder.set(it.orderId, m)
      }
      const withF = list.map(o => ({ ...o, flags: byOrder.get(o.id) ?? {} }))
      return NextResponse.json({ orders: withF });
    }

    return NextResponse.json({ orders: list });
  } catch (err) {
    console.error('[GET /api/zlecenia] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    const body = await req.json().catch(() => null);
    return await createOrderFromBody(session, body);
  } catch (err) {
    console.error('[POST /api/zlecenia] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

// PATCH przeniesiony do /api/zlecenia/[id]/route.ts