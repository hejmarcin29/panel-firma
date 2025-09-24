import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function AdminPanelAlias() {
  const session = await getServerSession(authOptions as any)
  const role = (session as any)?.user?.role
  if (role !== 'admin') {
    redirect('/panel/montazysta')
  }
  // / is już panelem admina – zróbmy alias:
  redirect('/')
}
