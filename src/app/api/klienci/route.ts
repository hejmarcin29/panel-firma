import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { desc } from "drizzle-orm";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

// GET /api/klienci - lista klientów (ostatnie najpierw)
export async function GET() {
  const list = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(200);
  return NextResponse.json({ clients: list });
}

// POST /api/klienci - utwórz klienta
export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const invoiceCity = (body.invoiceCity || "").trim();
  const invoiceAddress = (body.invoiceAddress || "").trim();
  const deliveryCity = (body.deliveryCity || "").trim();
  const deliveryAddress = (body.deliveryAddress || "").trim();

  if (!name) return NextResponse.json({ error: "Imię i nazwisko wymagane" }, { status: 400 });

  const id = randomUUID();
  await db.insert(clients).values({
    id,
    name,
    phone: phone || null,
    email: email || null,
    invoiceCity: invoiceCity || null,
    invoiceAddress: invoiceAddress || null,
    deliveryCity: deliveryCity || null,
    deliveryAddress: deliveryAddress || null,
  });

  const actor = (session as any)?.user?.email ?? null;
  await emitDomainEvent({
    type: DomainEventTypes.clientCreated,
    actor,
    entity: { type: 'client', id },
    payload: { id, name },
  });

  return NextResponse.json({ id });
}
