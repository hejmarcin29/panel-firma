import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { getSession } from '@/lib/auth-session';
import { emitDomainEvent, DomainEventTypes } from '@/domain/events';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

interface SessionUser { user?: { email?: string | null } | null }

// Allowed transitions simple map (from -> set of to)
const ALLOWED: Record<string, string[]> = {
  awaiting_measurement: ['ready_to_schedule','cancelled'],
  ready_to_schedule: ['scheduled','cancelled'],
  scheduled: ['completed','cancelled'],
  completed: [],
  cancelled: [],
};

// GET /api/zlecenia/:id
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[GET /api/zlecenia/:id] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

const patchSchema = z.object({ status: z.string() });

// PATCH /api/zlecenia/:id  body { status }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    const userEmail = (session as SessionUser | null)?.user?.email ?? null;
    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 });
    const newStatus = parsed.data.status;
    const { id } = await params;
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    if (order.status === newStatus) return NextResponse.json({ ok: true });
    const allowed = ALLOWED[order.status] || [];
    if (!allowed.includes(newStatus)) return NextResponse.json({ error: 'Niedozwolona zmiana statusu' }, { status: 400 });
    await db.update(orders).set({ status: newStatus }).where(eq(orders.id, id));
    await emitDomainEvent({
      type: DomainEventTypes.orderStatusChanged,
      actor: userEmail,
      entity: { type: 'order', id },
      payload: { id, from: order.status, to: newStatus },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/zlecenia/:id] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
