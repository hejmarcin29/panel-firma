import { db } from "@/db";
import { clients, orders, users } from "@/db/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { formatDate } from "@/lib/date";
import { pl } from "@/i18n/pl";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/badges";

// Ta strona korzysta z bazy w czasie żądania – wyłączamy prerender przy buildzie
export const dynamic = "force-dynamic";

export default async function OrdersArchivePage() {
  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      type: orders.type,
      status: orders.status,
      clientId: orders.clientId,
      orderNo: orders.orderNo,
      clientName: clients.name,
      scheduledDate: orders.scheduledDate,
      installerName: users.name,
      archivedAt: orders.archivedAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
    .where(isNotNull(orders.archivedAt))
    .orderBy(desc(orders.archivedAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Archiwum zleceń</h1>
        <Link
          href="/zlecenia"
          className="hover:underline focus:underline focus:outline-none"
        >
          Powrót do listy
        </Link>
      </div>

      {/* Table for md+ */}
      <div className="mt-4 rounded-md border border-black/10 dark:border-white/10 hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Klient</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Planowana data</th>
              <th className="px-3 py-2">Montażysta</th>
              <th className="px-3 py-2">Zarchiwizowano</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center opacity-70">
                  Brak pozycji w archiwum
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 anim-enter"
                >
                  <td className="px-3 py-2">
                    <Link
                      className="hover:underline focus:underline focus:outline-none"
                      href={
                        r.orderNo
                          ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                          : `/zlecenia/${r.id}`
                      }
                    >
                      {r.orderNo ? (
                        <span>
                          <span className="font-mono">{`${r.orderNo}_${r.type === "installation" ? "m" : "d"}`}</span>
                          <span className="opacity-60">
                            {" "}
                            ({r.id.slice(0, 8)})
                          </span>
                        </span>
                      ) : (
                        r.id.slice(0, 8)
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.clientName || r.clientId}</td>
                  <td className="px-3 py-2">
                    <Badge size="xs" variant="neutral">
                      {r.type === "installation"
                        ? pl.orders.typeInstallation
                        : pl.orders.typeDelivery}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      status={r.status}
                      label={
                        (pl.orders.statuses as Record<string, string>)[
                          r.status
                        ] || r.status
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    {formatDate(r.scheduledDate, "-")}
                  </td>
                  <td className="px-3 py-2">{r.installerName || "-"}</td>
                  <td className="px-3 py-2">{formatDate(r.archivedAt, "-")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="mt-4 space-y-2 md:hidden">
        {rows.length === 0 ? (
          <div className="px-3 py-6 text-center opacity-70">
            Brak pozycji w archiwum
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-black/10 dark:border-white/10 p-3 anim-enter"
            >
              <div className="flex items-center justify-between">
                <Link
                  className="font-medium hover:underline focus:underline focus:outline-none"
                  href={
                    r.orderNo
                      ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                      : `/zlecenia/${r.id}`
                  }
                >
                  {r.orderNo
                    ? `${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                    : r.id.slice(0, 8)}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge size="xs" variant="neutral">
                    {r.type === "installation"
                      ? pl.orders.typeInstallation
                      : pl.orders.typeDelivery}
                  </Badge>
                  <StatusBadge
                    status={r.status}
                    label={
                      (pl.orders.statuses as Record<string, string>)[
                        r.status
                      ] || r.status
                    }
                  />
                </div>
              </div>
              <div className="mt-1 text-sm">{r.clientName || r.clientId}</div>
              <div className="mt-1 flex items-center justify-between text-xs opacity-70">
                <span>{formatDate(r.scheduledDate, "-")}</span>
                <span>{formatDate(r.archivedAt, "-")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
