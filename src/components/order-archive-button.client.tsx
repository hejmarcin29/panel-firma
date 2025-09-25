"use client"
import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toaster'

export function OrderArchiveButton({ id }: { id: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    <button onClick={archive} disabled={loading} className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10">Do archiwum</button>
  )
}
