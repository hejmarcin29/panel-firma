"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toaster'

type Item = { key: string; label: string; done: boolean }

type Props = {
  orderId: string
  type: 'delivery' | 'installation'
  items: Item[]
}

const labels: Record<'delivery'|'installation', Record<string,string>> = {
  delivery: {
    proforma: 'Proforma',
    advance_invoice: 'FV zaliczkowa',
    final_invoice: 'FV końcowa',
    post_delivery_invoice: 'FV po dostawie',
    quote: 'Wycena',
    done: 'Koniec',
  },
  installation: {
    measurement: 'Pomiar',
    quote: 'Wycena',
    contract: 'Umowa',
    advance_payment: 'Zaliczka',
    installation: 'Montaż',
    handover_protocol: 'Protokół',
    final_invoice: 'FV końcowa',
    done: 'Koniec',
  }
}

const orderForType: Record<'delivery'|'installation', string[]> = {
  delivery: ['proforma','advance_invoice','final_invoice','post_delivery_invoice','quote','done'],
  installation: ['measurement','quote','contract','advance_payment','installation','handover_protocol','final_invoice','done']
}

export function QuickChecklistBar({ orderId, type, items }: Props) {
  const map = useMemo(() => new Map(items.map(i => [i.key, i.done])), [items])
  const [local, setLocal] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [placement, setPlacement] = useState<'top'|'bottom'>('bottom')
  const popRef = useRef<HTMLDivElement | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Sync local shadow state with props
  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const k of orderForType[type]) next[k] = map.get(k) || false
    setLocal(next)
  }, [items, type, map])

  const popoverWidth = 288 // w-72

  function updatePosition() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const margin = 8
    const left = Math.min(
      Math.max(margin, r.left),
      (typeof window !== 'undefined' ? window.innerWidth : 1024) - popoverWidth - margin
    )
    // domyślnie poniżej
    let desiredTop = r.bottom + margin
    let desiredPlacement: 'top'|'bottom' = 'bottom'
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
    const measuredH = popRef.current?.offsetHeight ?? 0
    const height = measuredH || 240 // przybliżenie do czasu pierwszego pomiaru
    // jeśli brakuje miejsca poniżej – flip nad
    if (r.bottom + margin + height > viewportH && r.top - margin - height > 0) {
      desiredTop = r.top - margin - height
      desiredPlacement = 'top'
    }
    setPlacement(desiredPlacement)
    setCoords({ top: desiredTop, left })
  }

  // Aktualizuj pozycję przy resize/scroll (zamykanie robimy wyłącznie przyciskiem Zamknij)
  useEffect(() => {
  function onPointerDown() { /* noop: nie zamykamy kliknięciem poza */ }
  function onKey() { /* noop: nie zamykamy ESC */ }
    function onScroll() {
      if (open) updatePosition()
    }
    function onResize() {
      if (open) updatePosition()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
  // Używamy capture: true przy rejestracji – usuń z capture=true (boolean)
  window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      updatePosition()
      // Po wyrenderowaniu zmierz popover i ew. skoryguj (druga faza)
      const raf = requestAnimationFrame(() => {
        updatePosition()
        setAnimateIn(true)
      })
      return () => cancelAnimationFrame(raf)
    } else {
      setAnimateIn(false)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center gap-1"
      aria-label="Postęp checklisty"
      onClick={() => setOpen(true)}
    >
      {orderForType[type].map(k => {
        const checked = (k in local ? local[k] : map.get(k)) || false
        return (
          <span key={k} title={labels[type][k]} aria-label={labels[type][k]}
            className={[
              'inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[10px] select-none',
              checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-black/20 dark:border-white/20 text-black/60 dark:text-white/70'
            ].join(' ')}>
            {checked ? '✓' : ''}
          </span>
        )
      })}

      {open && coords ? createPortal((
        <div
          role="dialog"
          aria-label="Szczegóły checklisty"
          ref={popRef}
          className={[
            'fixed z-[1000] w-72 rounded-md border border-black/15 bg-[var(--pp-panel)] p-2 shadow-lg outline-none dark:border-white/15',
            'transition duration-150 ease-out',
            animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            placement === 'top' ? 'origin-bottom-left' : 'origin-top-left'
          ].join(' ')}
          style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
        >
          <div className="max-h-80 overflow-auto pr-1">
            {orderForType[type].map(k => {
              const checked = (k in local ? local[k] : map.get(k)) || false
              return (
                <label key={k} className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      disabled={busyKey === k}
                      onChange={async (e) => {
                        const next = e.currentTarget.checked
                        setBusyKey(k)
                        setLocal(prev => ({ ...prev, [k]: next }))
                        try {
                          const r = await fetch(`/api/zlecenia/${orderId}/checklist`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key: k, done: next })
                          })
                          if (!r.ok) {
                            setLocal(prev => ({ ...prev, [k]: !next }))
                            const j = await r.json().catch(() => null)
                            throw new Error(j?.error || 'Nie udało się zapisać')
                          }
                        } catch (err) {
                          toast({ title: 'Błąd', description: err instanceof Error ? err.message : 'Operacja nie powiodła się', variant: 'destructive' })
                        } finally {
                          setBusyKey(null)
                          // Odśwież widok subtelnie (opcjonalnie)
                          try { router.refresh() } catch {}
                        }
                      }}
                    />
                    <span>{labels[type][k]}</span>
                  </div>
                  <span className={checked ? 'text-emerald-600' : 'text-black/50 dark:text-white/50'}>{checked ? 'Zrobione' : 'Nie'}</span>
                </label>
              )
            })}
          </div>
          <div className="mt-2 text-right">
            <button
              className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            >
              Zamknij
            </button>
          </div>
        </div>
      ), document.body) : null}
    </div>
  )
}

export function ChecklistPopoverButton({ orderId, type, items }: Props) {
  const [open, setOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const map = useMemo(() => new Map(items.map(i => [i.key, i.done])), [items])

  async function toggle(key: string, done: boolean) {
    setBusyKey(key)
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/checklist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, done }) })
      if (!res.ok) throw new Error('Błąd')
      // optymistycznie aktualizujemy lokalną mapę
      map.set(key, done)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="relative inline-block">
      <button type="button" className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="dialog">
        Checklist
        <QuickChecklistBar orderId={orderId} type={type} items={orderForType[type].map(k => ({ key: k, label: k, done: map.get(k) || false }))} />
      </button>
      {open ? (
        <div role="dialog" aria-label="Checklist" className="absolute right-0 z-40 mt-2 w-72 rounded-md border bg-[var(--pp-panel)] p-2 shadow-lg"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <div className="max-h-80 overflow-auto pr-1">
            {orderForType[type].map(k => {
              const checked = map.get(k) || false
              return (
                <label key={k} className="flex items-center gap-2 px-1 py-1 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={checked} disabled={busyKey === k}
                    onChange={(e) => toggle(k, e.target.checked)} />
                  <span>{labels[type][k]}</span>
                </label>
              )
            })}
          </div>
          <div className="mt-2 flex justify-end">
            <button className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setOpen(false)}>Zamknij</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
