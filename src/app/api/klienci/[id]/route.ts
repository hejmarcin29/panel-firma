import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clients, clientNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

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
  const fields = [
    "name",
    "phone",
    "email",
    "invoiceCity",
    "invoiceAddress",
    "deliveryCity",
    "deliveryAddress",
  ] as const;

  // Fetch previous state for diff.
  const [before] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, any> = {};
  const changes: { field: string; before: any; after: any }[] = [];

  for (const f of fields) {
    if (f in body) {
      const incoming = (body as any)[f];
      const normalized = (incoming ?? null) === '' ? null : incoming;
      const prev = (before as any)[f];
      // Only treat as changed if different (strict inequality, but normalize undefined→null)
      if ((prev ?? null) !== (normalized ?? null)) {
        updates[f] = normalized;
        changes.push({ field: f, before: prev ?? null, after: normalized ?? null });
      }
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await db.update(clients).set(updates).where(eq(clients.id, id));
  const actor = (session as any)?.user?.email ?? null;
  const changedFields = Object.keys(updates);
  await emitDomainEvent({
    type: DomainEventTypes.clientUpdated,
    actor,
    entity: { type: 'client', id },
    payload: { id, changedFields, changes },
    schemaVersion: 2,
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/klienci/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  const actor = (session as any)?.user?.email ?? null;
  await emitDomainEvent({
    type: DomainEventTypes.clientDeleted,
    actor,
    entity: { type: 'client', id },
    payload: { id },
  });
  return NextResponse.json({ ok: true });
}
