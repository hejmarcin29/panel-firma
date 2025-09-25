import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, type Client } from "@/db/schema";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth-session";
import { desc } from "drizzle-orm";
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

  const data: Omit<Client, 'createdAt'> = {
    id: randomUUID(),
    name,
    phone: trimOrNull(body?.phone) ?? null,
    email: trimOrNull(body?.email) ?? null,
    invoiceCity: trimOrNull(body?.invoiceCity) ?? null,
    invoiceAddress: trimOrNull(body?.invoiceAddress) ?? null,
    deliveryCity: trimOrNull(body?.deliveryCity) ?? null,
    deliveryAddress: trimOrNull(body?.deliveryAddress) ?? null,
    // W tym etapie nie wybieramy typu usługi – ignorowane
    serviceType: null as unknown as Client['serviceType'],
  };

  await db.insert(clients).values(data);

  const userEmail = (session as SessionUser | null)?.user?.email ?? null;
  await emitDomainEvent({
    type: DomainEventTypes.clientCreated,
    actor: userEmail,
    entity: { type: 'client', id: data.id },
    payload: { id: data.id, name: data.name },
    schemaVersion: 2,
  });

  return NextResponse.json({ id: data.id });
}
