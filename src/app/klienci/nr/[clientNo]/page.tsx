import { redirect } from 'next/navigation'
import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function ClientByNumberPage({ params }: { params: Promise<{ clientNo: string }> }) {
  const { clientNo } = await params
  const no = parseInt(clientNo, 10)
  if (!Number.isFinite(no)) redirect('/klienci')
  const [c] = await db.select({ id: clients.id }).from(clients).where(eq(clients.clientNo, no)).limit(1)
  if (!c) redirect('/klienci')
  redirect(`/klienci/${c.id}`)
}
