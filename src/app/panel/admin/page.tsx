import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth-session'
export default async function AdminPanelAlias() {
  const session = await getSession()
  const role = session?.user?.role
  if (role !== 'admin') {
    redirect('/panel/montazysta')
  }
  // / is już panelem admina – zróbmy alias:
  redirect('/')
}
