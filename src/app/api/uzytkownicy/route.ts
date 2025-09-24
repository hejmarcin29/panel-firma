import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession, isUserRole } from '@/lib/auth-session';
import { randomUUID } from 'node:crypto';
import { hash } from '@/lib/hash';

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(12, 'Minimum 12 znaków'),
  role: z.enum(['admin','installer','architect','manager']).default('installer'),
});

export async function POST(req: Request) {
  try {
  const session = await getSession();
    const role = session?.user?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const json: unknown = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 });
    }
    const { email, name, password, role: newRole } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'Użytkownik z tym e-mailem już istnieje' }, { status: 409 });
    }
    const id = randomUUID();
    const passwordHash = await hash(password);
    await db.insert(users).values({ id, email: normalizedEmail, name: name ?? null, role: newRole, passwordHash });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[POST /api/uzytkownicy] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

// GET /api/uzytkownicy?role=installer
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const list = role && isUserRole(role)
      ? await db.select().from(users).where(eq(users.role, role)).limit(500)
      : await db.select().from(users).limit(500);
    return NextResponse.json({ users: list });
  } catch (err) {
    console.error('[GET /api/uzytkownicy] Error', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
