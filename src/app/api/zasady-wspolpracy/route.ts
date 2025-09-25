import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { cooperationRules, cooperationRuleAcks } from '@/db/schema'
import { desc, eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth-session'
import { randomUUID } from 'crypto'

// GET /api/zasady-wspolpracy?active=1
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const active = url.searchParams.get('active') === '1'
    const includeAck = url.searchParams.get('includeAck') === '1'
    if (active) {
      const rows = await db
        .select()
        .from(cooperationRules)
        .where(eq(cooperationRules.isActive, true))
        .orderBy(desc(cooperationRules.version))
        .limit(1)
      const rule = rows[0] ?? null
      if (!rule) return NextResponse.json({ rule: null })
      if (!includeAck) return NextResponse.json({ rule })
      const session = await getSession()
      const userId = session?.user?.id || null
      if (!userId) return NextResponse.json({ rule, ack: { acknowledged: false } })
      const ackRows = await db.select().from(cooperationRuleAcks).where(and(eq(cooperationRuleAcks.userId, userId), eq(cooperationRuleAcks.version, rule.version))).limit(1)
      return NextResponse.json({ rule, ack: { acknowledged: !!ackRows[0] } })
    }
    const rows = await db
      .select()
      .from(cooperationRules)
      .orderBy(desc(cooperationRules.version))
      .limit(50)
    return NextResponse.json({ rules: rows })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}

const upsertSchema = z.object({
  title: z.string().trim().min(1),
  contentMd: z.string().trim().min(1),
  version: z.number().int().positive(),
  isActive: z.boolean().default(true),
  requiresAck: z.boolean().default(true),
  audience: z.array(z.enum(['admin','installer','architect','manager'])).default(['installer']),
  effectiveFrom: z.number().int().optional().nullable(),
})

// POST /api/zasady-wspolpracy (admin): tworzy nową wersję, ustawia aktywność
export async function POST(req: Request) {
  try {
    const session = await getSession()
    const role = session?.user?.role
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const json = await req.json().catch(() => null)
    const parsed = upsertSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })

    const payload = parsed.data
    const audienceJson = JSON.stringify(payload.audience)
    // Jeśli nowa wersja jest aktywna, dezaktywuj poprzednią aktywną
    if (payload.isActive) {
      await db.update(cooperationRules).set({ isActive: false }).where(eq(cooperationRules.isActive, true))
    }
    await db.insert(cooperationRules).values({
      id: randomUUID(),
      title: payload.title,
      contentMd: payload.contentMd,
      version: payload.version,
      isActive: payload.isActive,
      requiresAck: payload.requiresAck,
      audienceJson,
      effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
