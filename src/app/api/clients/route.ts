import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { desc } from "drizzle-orm";

interface LegacyClientCreateBody {
  name?: string;
  phone?: string;
  email?: string;
  invoiceCity?: string;
  invoiceAddress?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  [k: string]: unknown;
}

// GET /api/clients - list clients (simple latest-first)
export async function GET() {
  const list = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(200);
  return NextResponse.json({ clients: list });
}

// POST /api/clients - create client
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null) as unknown;
  const body: LegacyClientCreateBody = raw && typeof raw === 'object' ? raw as LegacyClientCreateBody : {};
  const trim = (v?: string) => (v ?? '').trim();
  const name = trim(body.name);
  if (!name) return NextResponse.json({ error: "Imię i nazwisko wymagane" }, { status: 400 });
  const id = randomUUID();
  await db.insert(clients).values({
    id,
    name,
    phone: trim(body.phone) || null,
    email: trim(body.email) || null,
    invoiceCity: trim(body.invoiceCity) || null,
    invoiceAddress: trim(body.invoiceAddress) || null,
    deliveryCity: trim(body.deliveryCity) || null,
    deliveryAddress: trim(body.deliveryAddress) || null,
  });
  return NextResponse.json({ id });
}
