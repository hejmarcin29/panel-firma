import { db } from '@/db'
import { clients, orders } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-session'
import { ChecklistCell } from '@/components/checklist-cell.client'

export const dynamic = 'force-dynamic'

const cols = [
  { key: 'proforma', label: 'Proforma' },
  { key: 'advance_invoice', label: 'Faktura zaliczkowa' },
  { key: 'final_invoice', label: 'Faktura końcowa' },
  { key: 'post_delivery_invoice', label: 'Faktura po dostawie' },
  { key: 'quote', label: 'Wycena' },
  { key: 'done', label: 'Koniec' },
]

type Row = {
  id: string
  orderNo: string | null
  clientName: string | null
  flags: Record<string, boolean>
}

export default async function DeliveriesBoard() {
  const session = await getSession()
  const role = (session?.user && (session.user as { role?: string|null }).role) || null
  const allowed = role === 'admin' || role === 'manager' || role === 'architect'
  if (!allowed) redirect('/')
  const rows = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      clientName: clients.name,
      proforma: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'proforma' AND oci.done = 1)`,
      advance_invoice: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'advance_invoice' AND oci.done = 1)`,
      final_invoice: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'final_invoice' AND oci.done = 1)`,
      post_delivery_invoice: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'post_delivery_invoice' AND oci.done = 1)`,
      quote: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'quote' AND oci.done = 1)`,
      done: sql<boolean>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'done' AND oci.done = 1)`,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(orders.type, 'delivery'), isNull(orders.archivedAt)))

  const data: Row[] = rows.map(r => ({
    id: r.id,
    orderNo: r.orderNo,
    clientName: r.clientName,
    flags: {
      proforma: (r as any).proforma === 1 || (r as any).proforma === true,
      advance_invoice: (r as any).advance_invoice === 1 || (r as any).advance_invoice === true,
      final_invoice: (r as any).final_invoice === 1 || (r as any).final_invoice === true,
      post_delivery_invoice: (r as any).post_delivery_invoice === 1 || (r as any).post_delivery_invoice === true,
      quote: (r as any).quote === 1 || (r as any).quote === true,
      done: (r as any).done === 1 || (r as any).done === true,
    }
  }))

  return (
    <div className="mx-auto max-w-none p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Dostawy — checklisty</h1>
        <Link href="/montaze" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Przejdź do Montaży</Link>
      </div>
      <div className="rounded-md border border-black/10 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">Nr zlecenia</th>
              <th className="px-3 py-2">Klient</th>
              {cols.map(c => <th key={c.key} className="px-3 py-2 text-center">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={2+cols.length} className="px-3 py-6 text-center opacity-70">Brak zleceń</td></tr>
            ) : data.map(r => (
              <tr key={r.id} className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                <td className="px-3 py-2"><Link className="hover:underline focus:underline focus:outline-none" href={`/zlecenia/${r.id}`}>{r.orderNo || r.id.slice(0,8)}</Link></td>
                <td className="px-3 py-2">{r.clientName || '-'}</td>
                {cols.map(c => (
                  <td key={c.key} className="px-3 py-2 text-center">
                    <ChecklistCell orderId={r.id} keyName={c.key} initial={r.flags[c.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
