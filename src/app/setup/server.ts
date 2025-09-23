"use server"
import { db } from '@/db'
import { users } from '@/db/schema'
import { count, eq } from 'drizzle-orm'
import { hash } from '@/lib/hash'
import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'

export async function createAdmin(input: { email: string; password: string }) {
  const [{ value: total }] = await db.select({ value: count() }).from(users)
  if ((total ?? 0) > 0) {
    return { ok: false, message: 'Użytkownik już istnieje. Przejdź do logowania.' }
  }

  const id = randomUUID()
  const passwordHash = await hash(input.password)

  await db.insert(users).values({
    id,
    email: input.email.toLowerCase().trim(),
    name: 'Administrator',
    role: 'admin',
    passwordHash,
    // createdAt/updatedAt domyślne w schemacie
  })

  redirect('/login')
}
