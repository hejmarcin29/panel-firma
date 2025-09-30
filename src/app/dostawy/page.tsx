import { db } from "@/db";
import { clients, orders } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { ChecklistCell } from "@/components/checklist-cell.client";
import { OrderPipeline } from "@/components/order-pipeline.client";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

const cols = [
  { key: "proforma", label: "Proforma" },
  { key: "advance_invoice", label: "Faktura zaliczkowa" },
  { key: "final_invoice", label: "Faktura końcowa" },
  { key: "post_delivery_invoice", label: "Faktura po dostawie" },
  { key: "quote", label: "Wycena" },
  { key: "done", label: "Koniec" },
];

type Row = {
  id: string;
  orderNo: string | null;
  clientName: string | null;
  status: string;
  pipelineStage: string | null;
  flags: Record<string, boolean>;
};

export default async function DeliveriesBoard() {
  const session = await getSession();
  const role =
    (session?.user && (session.user as { role?: string | null }).role) || null;
  const allowed =
    role === "admin" || role === "manager" || role === "architect";
  if (!allowed) redirect("/");
  const rows = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      clientName: clients.name,
      status: orders.status,
      pipelineStage: orders.pipelineStage,
      // SQLite EXISTS zwraca 0/1 – typujemy jako number i rzutujemy na boolean
      proforma: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'proforma' AND oci.done = 1)`,
      advance_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'advance_invoice' AND oci.done = 1)`,
      final_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'final_invoice' AND oci.done = 1)`,
      post_delivery_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'post_delivery_invoice' AND oci.done = 1)`,
      quote: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'quote' AND oci.done = 1)`,
      done: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'done' AND oci.done = 1)`,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(orders.type, "delivery"), isNull(orders.archivedAt)));

  const data: Row[] = rows.map((r) => ({
    id: r.id,
    orderNo: r.orderNo,
    clientName: r.clientName,
    status: r.status,
    pipelineStage: r.pipelineStage ?? null,
    flags: {
      proforma: Boolean(r.proforma),
      advance_invoice: Boolean(r.advance_invoice),
      final_invoice: Boolean(r.final_invoice),
      post_delivery_invoice: Boolean(r.post_delivery_invoice),
      quote: Boolean(r.quote),
      done: Boolean(r.done),
    },
  }));

  return (
    <div className="mx-auto max-w-none p-4 md:p-6">
      <section
        className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)] mb-4"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(1000px 360px at -10% -20%, color-mix(in oklab, var(--pp-primary) 14%, transparent), transparent 42%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 8%, transparent), transparent 65%)",
          }}
        />
        <div className="relative z-10 p-4 md:p-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Dostawy — checklisty
          </h1>
          <Link
            href="/montaze"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Przejdź do Montaży
          </Link>
        </div>
      </section>
      {/* Mobile cards */}
      <div className="md:hidden mt-2 space-y-2">
        {data.length === 0 ? (
          <div className="px-3 py-6 text-center opacity-70">Brak zleceń</div>
        ) : (
          data.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-black/10 dark:border-white/10 p-3 anim-enter"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  <Link
                    className="hover:underline focus:underline focus:outline-none"
                    href={
                      r.orderNo ? `/zlecenia/nr/${r.orderNo}_d` : `/zlecenia/${r.id}`
                    }
                  >
                    {r.orderNo ? `${r.orderNo}_d` : r.id.slice(0, 8)}
                  </Link>
                </div>
                <Link
                  href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_d` : `/zlecenia/${r.id}`}
                  aria-label="Szczegóły"
                  title="Szczegóły"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  <Info className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-1 text-sm opacity-90">{r.clientName || "-"}</div>
              <div className="mt-2">
                <div className="text-xs opacity-70 mb-1">Etap</div>
                <OrderPipeline orderId={r.id} type={"delivery"} stage={r.pipelineStage} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {cols.map((c) => (
                  <div key={c.key} className="rounded-md border border-black/10 dark:border-white/10 p-2">
                    <div className="text-xs mb-1 opacity-70">{c.label}</div>
                    <div className="flex justify-center">
                      <ChecklistCell orderId={r.id} keyName={c.key} initial={r.flags[c.key]} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border border-black/10 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">Nr zlecenia</th>
              <th className="px-3 py-2">Klient</th>
              <th className="px-3 py-2">Etap</th>
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + cols.length}
                  className="px-3 py-6 text-center opacity-70"
                >
                  Brak zleceń
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 anim-enter"
                >
                  <td className="px-3 py-2">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        className="hover:underline focus:underline focus:outline-none"
                        href={
                          r.orderNo
                            ? `/zlecenia/nr/${r.orderNo}_d`
                            : `/zlecenia/${r.id}`
                        }
                      >
                        {r.orderNo ? `${r.orderNo}_d` : r.id.slice(0, 8)}
                      </Link>
                      <Link
                        href={
                          r.orderNo
                            ? `/zlecenia/nr/${r.orderNo}_d`
                            : `/zlecenia/${r.id}`
                        }
                        aria-label="Szczegóły"
                        title="Szczegóły"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.clientName || "-"}</td>
                  <td className="px-3 py-2">
                    <OrderPipeline
                      orderId={r.id}
                      type={"delivery"}
                      stage={r.pipelineStage}
                    />
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-center">
                      <ChecklistCell
                        orderId={r.id}
                        keyName={c.key}
                        initial={r.flags[c.key]}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
