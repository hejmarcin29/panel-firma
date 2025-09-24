import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clients, clientNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/klienci/[id]
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, id))
    .orderBy(desc(clientNotes.createdAt));
  return NextResponse.json({ client, notes });
}

// PATCH /api/klienci/[id] - aktualizacja danych klienta
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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
  await db.update(clients).set(updates).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/klienci/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}
