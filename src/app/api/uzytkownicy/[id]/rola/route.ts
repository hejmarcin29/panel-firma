import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { z } from 'zod';
import { emitDomainEvent, DomainEventTypes } from '@/domain/events';

const bodySchema = z.object({ role: z.enum(['admin','installer','architect','manager']) });

interface SessionLike { user?: { role?: string | null } | null }

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await getServerSession(authOptions as any);
    const sessionRole = (session as SessionLike | null)?.user?.role;
    if (!session || sessionRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 });
    }
  const { role: newRole } = parsed.data;
    const { id: userId } = await params;
    // read current role/email to enforce immutable admin and populate 'before'
    const [beforeUser] = await db
      .select({ role: users.role, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!beforeUser) {
      return NextResponse.json({ error: 'Nie znaleziono użytkownika' }, { status: 404 });
    }
    if (beforeUser.email?.toLowerCase() === 'admin@primepodloga.pl' && newRole !== 'admin') {
      return NextResponse.json({ error: 'Nie można zmienić roli tego użytkownika' }, { status: 400 });
    }
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    // Emit domain event for auditing
    await emitDomainEvent({
      type: DomainEventTypes.userRoleChanged,
      actor: (session as any)?.user?.email ?? 'system',
      entity: { type: 'user', id: userId },
      payload: { id: userId, before: beforeUser.role ?? 'unknown', after: newRole },
      schemaVersion: 1,
    });
    // Drizzle better-sqlite3 update().run() returns info through driver; we assume no throw = ok
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/uzytkownicy/:id/rola] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
