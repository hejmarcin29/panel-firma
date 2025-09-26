import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session'
import { savePrefs } from '@/lib/google-calendar'
import { z } from 'zod'

const schema = z.object({
  calendarId: z.string().min(1).nullable().optional(),
  timeZone: z.string().min(1).optional(),
  defaultReminderMinutes: z.number().int().min(0).max(24*60).optional(),
  autoSync: z.boolean().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    if (role !== 'installer' && role !== 'admin' && role !== 'manager') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    const json = await req.json().catch(() => null)
    const parsed = schema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })
    await savePrefs(userId, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Błąd'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
