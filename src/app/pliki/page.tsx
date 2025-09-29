import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-session'
import FilesBrowser from './files-browser.client'

export const dynamic = 'force-dynamic'

export default async function FilesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const role = session.user?.role
  if (!role || !['admin','manager','architect'].includes(role)) redirect('/')

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pliki (R2)</h1>
  <p className="opacity-70 text-sm">Przeglądanie plików programu w R2 (prefiks: „klienci/” — wewnętrznie „clients/”). Podgląd obrazów/PDF przez proxy. Usuwanie: tylko admin.</p>
      <FilesBrowser />
    </main>
  )
}

