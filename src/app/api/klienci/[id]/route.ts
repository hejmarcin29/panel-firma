import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, clientNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/klienci/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [client] = await db.select().from(clients).where(eq(clients.id, params.id)).limit(1);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, params.id))
    .orderBy(desc(clientNotes.createdAt));
  return NextResponse.json({ client, notes });
}

// PATCH /api/klienci/[id] - aktualizacja danych klienta
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: any = {};
  for (const k of [
    "name",
    "phone",
    "email",
    "invoiceCity",
    "invoiceAddress",
    "deliveryCity",
    "deliveryAddress",
  ]) {
    if (k in body) updates[k] = (body[k] ?? null) === "" ? null : body[k];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });
  await db.update(clients).set(updates).where(eq(clients.id, params.id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/klienci/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(clientNotes).where(eq(clientNotes.clientId, params.id));
  await db.delete(clients).where(eq(clients.id, params.id));
  return NextResponse.json({ ok: true });
}
