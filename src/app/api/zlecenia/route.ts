import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, clients, type Order } from '@/db/schema';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth-session';
import { emitDomainEvent, DomainEventTypes } from '@/domain/events';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

interface SessionUser { user?: { email?: string | null } | null }

const START_STATUS: Record<'delivery'|'installation', Order['status']> = {
  delivery: 'ready_to_schedule',
  installation: 'awaiting_measurement',
};

// GET /api/zlecenia?clientId=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    let list: Order[];
    if (clientId) {
      list = await db
        .select()
        .from(orders)
        .where(eq(orders.clientId, clientId))
        .orderBy(desc(orders.createdAt));
    } else {
      list = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(200);
    }
    return NextResponse.json({ orders: list });
  } catch (err) {
    console.error('[GET /api/zlecenia] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

// POST /api/zlecenia
// body: { clientId: uuid, type: 'delivery' | 'installation' }
const createOrderSchema = z.object({
  clientId: z.string().uuid({ message: 'Nieprawidłowy identyfikator klienta' }),
  type: z.enum(['delivery', 'installation'], { message: 'Nieprawidłowy typ' }),
});

export async function POST(req: Request) {
  try {
  const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    const userEmail = (session as SessionUser | null)?.user?.email ?? null;
    const json = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 });
    }
    const { clientId, type } = parsed.data;
    // Sprawdź istnienie klienta (zapobiega osieroconym rekordom)
    const [clientExists] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    if (!clientExists) {
      return NextResponse.json({ error: 'Klient nie istnieje' }, { status: 400 });
    }
    const status = START_STATUS[type];
    const id = randomUUID();
    await db.insert(orders).values({
      id,
      clientId,
      type,
      status,
      requiresMeasurement: type === 'installation',
    });
    await emitDomainEvent({
      type: DomainEventTypes.orderCreated,
      actor: userEmail,
      entity: { type: 'order', id },
      payload: { id, clientId, type, status },
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[POST /api/zlecenia] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

// PATCH przeniesiony do /api/zlecenia/[id]/route.ts