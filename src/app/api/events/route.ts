import { NextResponse } from 'next/server';
import { domainEvents } from '@/db/schema';
import { desc } from 'drizzle-orm';

// Ten endpoint korzysta z DB – wyłącz statyczne cachowanie/prerender
export const dynamic = 'force-dynamic'

// GET /api/events - latest domain events (limit 100)
export async function GET() {
  // Lazy import DB, aby nie otwierać połączenia podczas build-time analizy modułów
  const { db } = await import('@/db');
  const rows = await db.select().from(domainEvents).orderBy(desc(domainEvents.occurredAt)).limit(100);
  // Parse payload JSON lazily (client can stringify)
  const events = rows.map(r => ({
    id: r.id,
    type: r.type,
    occurredAt: r.occurredAt?.getTime?.() ?? null,
    actor: r.actor,
    entityType: r.entityType,
    entityId: r.entityId,
    payload: (() => { try { return r.payload ? JSON.parse(r.payload) : null; } catch { return null; } })(),
    schemaVersion: r.schemaVersion,
  }));
  return NextResponse.json({ events });
}
