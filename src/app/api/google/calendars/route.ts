import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session'
import { listMyCalendars } from '@/lib/google-calendar'

export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    if (role !== 'installer' && role !== 'admin' && role !== 'manager') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    const json = await listMyCalendars(userId)
    return NextResponse.json(json)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Błąd'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
