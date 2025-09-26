"use client"
import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toaster'
import { AlertDialog } from '@/components/ui/alert-dialog'

export function OrderArchiveButton({ id }: { id: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  async function archive() {
    try {
      setLoading(true)
      const r = await fetch(`/api/zlecenia/${id}/archiwum`, { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Nie udało się zarchiwizować')
      toast({ title: 'Przeniesiono do archiwum', variant: 'success' })
      startTransition(() => router.refresh())
    } catch (e: unknown) {
      toast({ title: 'Błąd', description: e instanceof Error ? e.message : 'Operacja nie powiodła się', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <button onClick={() => setConfirmOpen(true)} disabled={loading} className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10">Do archiwum</button>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Przenieść do archiwum?"
        description={
          <>
            <p>Zlecenie zostanie oznaczone jako zarchiwizowane.</p>
            <p className="text-xs opacity-70">Możesz cofnąć to działanie w każdej chwili.</p>
          </>
        }
        cancelText="Anuluj"
        confirmText={loading ? 'Przenoszę…' : 'Archiwizuj'}
        onConfirm={archive}
      />
    </>
  )
}
