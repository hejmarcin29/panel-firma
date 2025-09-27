import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth-session";
import { desc, isNotNull } from "drizzle-orm";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface SessionUser {
  user?: { email?: string | null; role?: string | null } | null;
}

interface ClientCreateBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  invoiceCity?: string | null;
  invoiceAddress?: string | null;
  deliveryCity?: string | null;
  deliveryAddress?: string | null;
  // serviceType usunięte z formularza – pozostawiamy pole na przyszłość (ignorowane przy create)
  // Allow unknown extra keys (ignored)
  [key: string]: unknown;
}

// GET /api/klienci - lista klientów (ostatnie najpierw)
export async function GET() {
  const list = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(200);
  return NextResponse.json({ clients: list });
}

// POST /api/klienci - utwórz klienta
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = (await req.json().catch(() => null)) as unknown;
    const body: Partial<ClientCreateBody> | null = (raw && typeof raw === 'object') ? raw as Partial<ClientCreateBody> : null;

    const trimOrNull = (v: unknown) => {
      if (typeof v !== 'string') return null;
      const t = v.trim();
      return t === '' ? null : t;
    };

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ error: "Imię i nazwisko wymagane" }, { status: 400 });

    // Dane bazowe (clientNo wyliczymy poniżej)
    const base: Omit<typeof clients.$inferInsert, 'clientNo'> = {
      id: randomUUID(),
      name,
      phone: trimOrNull(body?.phone) ?? null,
      email: trimOrNull(body?.email) ?? null,
      invoiceCity: trimOrNull(body?.invoiceCity) ?? null,
      invoiceAddress: trimOrNull(body?.invoiceAddress) ?? null,
      deliveryCity: trimOrNull(body?.deliveryCity) ?? null,
      deliveryAddress: trimOrNull(body?.deliveryAddress) ?? null,
      // Ustaw jawnie, aby nie łapać NOT NULL przy create
      serviceType: 'with_installation',
    };

    // Wylicz next clientNo bez transakcji (retry przy konflikcie unikalności)
    const computeNextNo = async () => {
      const last = await db
        .select({ no: clients.clientNo })
        .from(clients)
        .where(isNotNull(clients.clientNo))
        .orderBy(desc(clients.clientNo))
        .limit(1);
      const maxNo = last[0]?.no ?? null;
      return (maxNo ?? 9) + 1;
    };

    let attempts = 0;
    const maxAttempts = 3;
    let created = false;
    let clientNoAssigned: number | null = null;
    while (!created && attempts < maxAttempts) {
      attempts++;
      const nextNo = await computeNextNo();
      try {
        await db.insert(clients).values({ ...base, clientNo: nextNo });
        clientNoAssigned = nextNo;
        created = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/unique|UNIQUE|constraint/i.test(msg)) {
          // Kolizja numeru – spróbuj ponownie
          continue;
        }
        console.error('[POST /api/klienci] Insert failed', e);
        return NextResponse.json({ error: 'Błąd serwera (insert)' }, { status: 500 });
      }
    }
    if (!created) {
      return NextResponse.json({ error: 'Konflikt numeracji klienta, spróbuj ponownie' }, { status: 409 });
    }

    const userEmail = (session as SessionUser | null)?.user?.email ?? null;
    await emitDomainEvent({
      type: DomainEventTypes.clientCreated,
      actor: userEmail,
      entity: { type: 'client', id: base.id },
      payload: { id: base.id, name: base.name, clientNo: clientNoAssigned },
      schemaVersion: 2,
    });

    return NextResponse.json({ id: base.id });
  } catch (err) {
    console.error('[POST /api/klienci] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
