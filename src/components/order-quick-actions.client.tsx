"use client";
import { useRouter } from 'next/navigation'

export function OrderQuickActions({ clientHref, infoId = 'order-info', detailsId = 'order-details' }: { clientHref: string; infoId?: string; detailsId?: string }) {
  const router = useRouter()

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => scrollTo(infoId)} className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Dane</button>
      <button onClick={() => scrollTo(detailsId)} className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Szczegóły</button>
      <button onClick={() => router.push(clientHref)} className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Wejdź do klienta</button>
    </div>
  )
}
