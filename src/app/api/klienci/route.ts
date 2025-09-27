import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, orders } from "@/db/schema";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth-session";
import { desc, isNotNull, and, isNull, eq, sql } from "drizzle-orm";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface SessionUser {
  user?: { email?: string | null; role?: string | null } | null;
}

interface ClientCreateBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null; // NIP (opcjonalnie)
  companyName?: string | null;
  invoiceCity?: string | null;
  invoicePostalCode?: string | null;
  invoiceAddress?: string | null;
  // serviceType usunięte z formularza – pozostawiamy pole na przyszłość (ignorowane przy create)
  // Allow unknown extra keys (ignored)
  [key: string]: unknown;
}

// GET /api/klienci - lista klientów (ostatnie najpierw)
export async function GET() {
  // Base clients
  const list = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      deliveryCity: clients.deliveryCity,
      invoiceCity: clients.invoiceCity,
      clientNo: clients.clientNo,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .orderBy(desc(clients.createdAt))
    .limit(200);

  // For each client gather: activeOrders, latest pipeline per type
  const out = [] as Array<any>;
  for (const c of list) {
    const [activeOrdersRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.clientId, c.id), isNull(orders.archivedAt), isNull(orders.outcome)));

    const [inst] = await db
      .select({ s: orders.pipelineStage })
      .from(orders)
      .where(and(eq(orders.clientId, c.id), eq(orders.type, 'installation'), isNull(orders.archivedAt)))
      .orderBy(desc(orders.pipelineStageUpdatedAt))
      .limit(1);

    const [deliv] = await db
      .select({ s: orders.pipelineStage })
      .from(orders)
      .where(and(eq(orders.clientId, c.id), eq(orders.type, 'delivery'), isNull(orders.archivedAt)))
      .orderBy(desc(orders.pipelineStageUpdatedAt))
      .limit(1);

    out.push({ ...c, _activeOrders: activeOrdersRow?.c ?? 0, _installationStage: inst?.s ?? null, _deliveryStage: deliv?.s ?? null });
  }

  return NextResponse.json({ clients: out });
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
      taxId: trimOrNull(body?.taxId) ?? null,
      companyName: trimOrNull(body?.companyName) ?? null,
      invoiceCity: trimOrNull(body?.invoiceCity) ?? null,
      invoicePostalCode: trimOrNull(body?.invoicePostalCode) ?? null,
      invoiceAddress: trimOrNull(body?.invoiceAddress) ?? null,
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
