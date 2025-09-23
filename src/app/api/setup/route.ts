import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { count } from 'drizzle-orm'
import { hash } from '@/lib/hash'
import { randomUUID } from 'node:crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').toLowerCase().trim()
    const password = String(body?.password || '')
    if (!email || !password || password.length < 12) {
      return NextResponse.json({ message: 'Nieprawidłowe dane' }, { status: 400 })
    }
    const [{ value: total }] = await db.select({ value: count() }).from(users)
    if ((total ?? 0) > 0) {
      return NextResponse.json({ message: 'Użytkownik już istnieje — przejdź do logowania.' }, { status: 409 })
    }
    const passwordHash = await hash(password)
    await db.insert(users).values({ id: randomUUID(), email, name: 'Administrator', role: 'admin', passwordHash })
    return NextResponse.json({ ok: true, message: 'Utworzono konto administratora. Możesz się zalogować.' })
  } catch (e) {
    return NextResponse.json({ message: 'Błąd serwera' }, { status: 500 })
  }
}
