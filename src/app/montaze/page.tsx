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
  { key: "measurement", label: "Pomiar" },
  { key: "quote", label: "Wycena" },
  { key: "contract", label: "Umowa" },
  { key: "advance_payment", label: "Zaliczka" },
  { key: "installation", label: "Montaż" },
  { key: "handover_protocol", label: "Protokół" },
  { key: "final_invoice", label: "Faktura końcowa" },
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

export default async function InstallationsBoard() {
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
      // boolean per key using EXISTS
      measurement: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'measurement' AND oci.done = 1)`,
      quote: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'quote' AND oci.done = 1)`,
      contract: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'contract' AND oci.done = 1)`,
      advance_payment: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'advance_payment' AND oci.done = 1)`,
      installation: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'installation' AND oci.done = 1)`,
      handover_protocol: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'handover_protocol' AND oci.done = 1)`,
      final_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'final_invoice' AND oci.done = 1)`,
      done: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'done' AND oci.done = 1)`,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(orders.type, "installation"), isNull(orders.archivedAt)));

  const data: Row[] = rows.map((r) => ({
    id: r.id,
    orderNo: r.orderNo,
    clientName: r.clientName,
    status: r.status,
    pipelineStage: r.pipelineStage ?? null,
    flags: {
      measurement: Boolean(r.measurement),
      quote: Boolean(r.quote),
      contract: Boolean(r.contract),
      advance_payment: Boolean(r.advance_payment),
      installation: Boolean(r.installation),
      handover_protocol: Boolean(r.handover_protocol),
      final_invoice: Boolean(r.final_invoice),
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
            Montaże — checklisty
          </h1>
          <Link
            href="/dostawy"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Przejdź do Dostaw
          </Link>
        </div>
      </section>
      <div className="rounded-md border border-black/10 dark:border-white/10 overflow-x-auto">
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
                            ? `/zlecenia/nr/${r.orderNo}_m`
                            : `/zlecenia/${r.id}`
                        }
                      >
                        {r.orderNo ? `${r.orderNo}_m` : r.id.slice(0, 8)}
                      </Link>
                      <Link
                        href={
                          r.orderNo
                            ? `/zlecenia/nr/${r.orderNo}_m`
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
                      type={"installation"}
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
