"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function OrderOutcomeButtons({ id, outcome, size = 'sm' }: { id: string; outcome: 'won'|'lost'|null; size?: 'sm'|'md' }) {
  const [pending, setPending] = useState<'won'|'lost'|null>(null)
  const [openLost, setOpenLost] = useState(false)
  const [reasonCode, setReasonCode] = useState<string>("")
  const [reasonNote, setReasonNote] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  if (outcome) {
    return <span className="text-xs opacity-70">{outcome === 'won' ? 'Wygrane' : 'Przegrane'}</span>
  }

  const setOutcome = async (o: 'won'|'lost', extra?: { reasonCode?: string|null, reasonNote?: string|null }) => {
    try {
      setPending(o)
      const r = await fetch(`/api/zlecenia/${id}/wynik`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: o, reasonCode: extra?.reasonCode ?? null, reasonNote: extra?.reasonNote ?? null })
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        throw new Error(j?.error || 'Błąd')
      }
      toast({ title: 'Zapisano', description: o === 'won' ? 'Oznaczono jako wygrane' : 'Oznaczono jako przegrane', variant: 'success' })
      router.refresh()
    } catch (e) {
      toast({ title: 'Błąd', description: e instanceof Error ? e.message : 'Nie udało się zapisać', variant: 'destructive' })
    } finally {
      setPending(null)
    }
  }

  const reasons = [
    { id: 'price', label: 'Cena' },
    { id: 'competition', label: 'Konkurencja' },
    { id: 'no_contact', label: 'Brak kontaktu' },
    { id: 'resigned', label: 'Rezygnacja' },
    { id: 'other', label: 'Inny powód' },
  ] as const

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size={size} disabled={pending !== null} onClick={() => setOutcome('won')}>
        <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" /> Wygrane
      </Button>
      <Button variant="outline" size={size} disabled={pending !== null} onClick={() => setOpenLost(true)}>
        <XCircle className="mr-1 h-4 w-4 text-red-600" /> Przegrane
      </Button>

      <AlertDialog
        open={openLost}
        onOpenChange={(v) => {
          setOpenLost(v)
          if (!v) {
            setReasonCode("")
            setReasonNote("")
          }
        }}
        title="Podaj powód przegranej"
        description={(
          <div className="mt-2 space-y-3">
            <div>
              <label className="mb-1 block text-xs opacity-70">Powód</label>
              <select
                className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <option value="" disabled>— wybierz —</option>
                {reasons.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Notatka (opcjonalnie)</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-black/15 bg-transparent p-2 text-sm outline-none dark:border-white/15"
                placeholder="Dodatkowe informacje…"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
              />
            </div>
          </div>
        )}
        confirmText={pending === 'lost' ? 'Zapisywanie…' : 'Zapisz jako przegrane'}
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!reasonCode) return; // prosta walidacja
          await setOutcome('lost', { reasonCode, reasonNote: reasonNote.trim() ? reasonNote : null })
        }}
      />
    </div>
  )
}
