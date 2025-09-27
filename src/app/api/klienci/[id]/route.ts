import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clients, clientNotes, type Client } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface SessionUser {
  user?: {
    email?: string | null;
    role?: string | null;
  } | null;
}

type UpdatableClientField = 'name' | 'phone' | 'email' | 'taxId' | 'companyName' | 'invoiceCity' | 'invoicePostalCode' | 'invoiceAddress';
type ClientUpdateBody = Partial<Record<UpdatableClientField, unknown>> & { [k: string]: unknown };
interface FieldChange { field: UpdatableClientField; before: string | null; after: string | null }

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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null) as unknown;
  const body: ClientUpdateBody = raw && typeof raw === 'object' ? (raw as ClientUpdateBody) : {};
  const fields: UpdatableClientField[] = ['name','phone','email','taxId','companyName','invoiceCity','invoicePostalCode','invoiceAddress'];

  const [before] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const userEmail = (session as SessionUser | null)?.user?.email ?? null;

  const updates: Partial<Record<UpdatableClientField, string | null>> = {};
  const changes: FieldChange[] = [];

  const normalize = (v: unknown, field: UpdatableClientField): string | null => {
    if (v == null) return field === 'name' ? null : null; // name null filtered later
    if (typeof v !== 'string') return null;
    const t = v.trim();
    if (t === '') return null;
    return t;
  };

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      const incoming = normalize(body[f], f);
      const prev = before[f as keyof Client] as unknown as string | null; // all updatable fields are string|null in schema
      if ((prev ?? null) !== (incoming ?? null)) {
        // Do not allow setting required name to null
        if (f === 'name' && incoming === null) {
          // skip invalid null assignment
        } else {
          updates[f] = incoming;
        }
        changes.push({ field: f, before: prev ?? null, after: incoming ?? null });
      }
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  // Build set object with only provided keys. Drizzle's columns accept null for nullable fields.
  const setObject: Partial<Client> = {};
  (Object.entries(updates) as [UpdatableClientField, string | null][]).forEach(([k, v]) => {
    if (v === undefined) return;
    switch (k) {
      case 'name':
        if (typeof v === 'string') setObject.name = v; break;
      case 'phone': setObject.phone = v; break;
      case 'email': setObject.email = v; break;
      case 'taxId': setObject.taxId = v; break;
  case 'companyName': setObject.companyName = v; break;
      case 'invoiceCity': setObject.invoiceCity = v; break;
  case 'invoicePostalCode': setObject.invoicePostalCode = v; break;
      case 'invoiceAddress': setObject.invoiceAddress = v; break;
    }
  });
  await db.update(clients).set(setObject).where(eq(clients.id, id));
  await emitDomainEvent({
    type: DomainEventTypes.clientUpdated,
    actor: userEmail,
    entity: { type: 'client', id },
    payload: { id, changedFields: Object.keys(updates), changes },
    schemaVersion: 2,
  });
  // Zmiana serviceType usunięta z logiki — brak dodatkowego eventu
  return NextResponse.json({ ok: true });
}

// DELETE /api/klienci/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userEmail = (session as SessionUser | null)?.user?.email ?? null;

  await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  await emitDomainEvent({
    type: DomainEventTypes.clientDeleted,
    actor: userEmail,
    entity: { type: 'client', id },
    payload: { id },
  });
  return NextResponse.json({ ok: true });
}
