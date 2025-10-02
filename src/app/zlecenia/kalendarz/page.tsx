export const dynamic = "force-dynamic";

import { db } from "@/db";
import {
  clients,
  deliverySlots,
  installationSlots,
  orders,
  users,
  orderChecklistItems,
  orderGoogleEvents,
} from "@/db/schema";
import { and, eq, inArray, asc } from "drizzle-orm";
import { getSession, isUserRole } from "@/lib/auth-session";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  href: string;
  kind: "delivery" | "installation";
  // preview fields
  clientName?: string | null;
  orderNo?: string | null;
  phone?: string | null;
  address?: string | null;
  checklistDoneCount?: number;
  installerId?: string | null;
  // collisions
  collision?: boolean;
  colliding?: {
    orderNo?: string | null;
    clientName?: string | null;
    href: string;
  }[];
  // google sync
  googleSync?: "synced" | "pending" | "error";
};
type SearchParams = Promise<{
  installer?: string;
  date?: string;
  view?: string;
  range?: string;
  kinds?: string;
  statuses?: string;
  q?: string;
}>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const role =
    session?.user?.role && isUserRole(session.user.role)
      ? session.user.role
      : undefined;
  const userId = session?.user?.id || undefined;
  const {
    installer = "",
    date = "",
    view = "",
    range = "",
    kinds: kindsParam = "",
    statuses: statusesParam = "",
    q = "",
  } = await searchParams;
  // If installer role, force own installerId
  const effectiveInstaller =
    role === "installer" && userId ? userId : installer;
  // Parse filters
  const statusFilter =
    (statusesParam?.split(",").filter(Boolean) as (
      | "planned"
      | "confirmed"
    )[]) || [];
  const kindsFilter =
    (kindsParam?.split(",").filter(Boolean) as (
      | "installation"
      | "delivery"
    )[]) || [];
  const statusesArr = (
    statusFilter.length ? statusFilter : (["planned", "confirmed"] as const)
  ) as readonly ("planned" | "confirmed")[];
  const showInstallations =
    kindsFilter.length === 0 || kindsFilter.includes("installation");
  const showDeliveries =
    kindsFilter.length === 0 || kindsFilter.includes("delivery");
  const qNorm = q.trim().toLowerCase();
  // Pobierz przyszłe sloty o statusie planned/confirmed
  const dRows = await db
    .select({
      id: deliverySlots.id,
      orderId: deliverySlots.orderId,
      plannedAt: deliverySlots.plannedAt,
      status: deliverySlots.status,
      clientName: clients.name,
      orderNo: orders.orderNo,
      orderType: orders.type,
      phone: clients.phone,
      orderLocationCity: orders.locationCity,
      orderLocationAddress: orders.locationAddress,
      clientDeliveryCity: clients.deliveryCity,
      clientDeliveryAddress: clients.deliveryAddress,
    })
    .from(deliverySlots)
    .leftJoin(orders, eq(deliverySlots.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(inArray(deliverySlots.status, statusesArr as readonly string[]))
    .orderBy(asc(deliverySlots.plannedAt));

  const iRows = await db
    .select({
      id: installationSlots.id,
      orderId: installationSlots.orderId,
      plannedAt: installationSlots.plannedAt,
      status: installationSlots.status,
      installerId: installationSlots.installerId,
      clientName: clients.name,
      orderNo: orders.orderNo,
      orderType: orders.type,
      phone: clients.phone,
      orderLocationCity: orders.locationCity,
      orderLocationAddress: orders.locationAddress,
      clientDeliveryCity: clients.deliveryCity,
      clientDeliveryAddress: clients.deliveryAddress,
    })
    .from(installationSlots)
    .leftJoin(orders, eq(installationSlots.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(
      and(
        inArray(installationSlots.status, statusesArr as readonly string[]),
        ...(effectiveInstaller
          ? [eq(installationSlots.installerId, effectiveInstaller)]
          : []),
      ),
    )
    .orderBy(asc(installationSlots.plannedAt));

  const fmtHref = (
    orderId: string,
    orderNo: string | null,
    type: "delivery" | "installation",
  ) =>
    orderNo
  ? (type === "installation" ? `/montaz/nr/${orderNo}_m` : `/dostawa/nr/${orderNo}_d`)
  : (type === "installation" ? `/montaz/${orderId}` : `/dostawa/${orderId}`);

  const toIsoDate = (v: number | Date | null) => {
    if (!v) return undefined;
    const d = v instanceof Date ? v : new Date(v);
    return d.toISOString().slice(0, 10);
  };

  // Apply q filter (client name or order no). Keep minimal until we enrich events.
  const dRowsFiltered =
    !qNorm || qNorm.length < 2
      ? dRows
      : dRows.filter(
          (r) =>
            (r.clientName ?? "").toLowerCase().includes(qNorm) ||
            (r.orderNo ?? "").toLowerCase().includes(qNorm),
        );
  const iRowsFiltered =
    !qNorm || qNorm.length < 2
      ? iRows
      : iRows.filter(
          (r) =>
            (r.clientName ?? "").toLowerCase().includes(qNorm) ||
            (r.orderNo ?? "").toLowerCase().includes(qNorm),
        );

  // Checklist done count per order
  const orderIds = Array.from(
    new Set([...dRowsFiltered, ...iRowsFiltered].map((r) => r.orderId)),
  );
  const checklistCounts = orderIds.length
    ? await db
        .select({
          orderId: orderChecklistItems.orderId,
          done: orderChecklistItems.done,
        })
        .from(orderChecklistItems)
        .where(inArray(orderChecklistItems.orderId, orderIds))
    : [];
  const doneByOrder = new Map<string, number>();
  for (const row of checklistCounts) {
    if (row.done)
      doneByOrder.set(row.orderId, (doneByOrder.get(row.orderId) ?? 0) + 1);
  }

  // Google sync mapping by orderId+installerId
  const googleRows = orderIds.length
    ? await db
        .select({
          orderId: orderGoogleEvents.orderId,
          installerId: orderGoogleEvents.installerId,
          googleEventId: orderGoogleEvents.googleEventId,
        })
        .from(orderGoogleEvents)
        .where(inArray(orderGoogleEvents.orderId, orderIds))
    : [];
  const googleByKey = new Map<string, string>();
  for (const r of googleRows) {
    const key = `${r.orderId}::${r.installerId}`;
    googleByKey.set(key, r.googleEventId);
  }

  // Conflicts: same installer, same day with 2+ events
  const byInstallerDay = new Map<string, typeof iRowsFiltered>();
  for (const r of iRowsFiltered) {
    const day = toIsoDate(r.plannedAt!)!;
    const key = `${r.installerId ?? "none"}::${day}`;
    const arr = byInstallerDay.get(key) ?? [];
    arr.push(r);
    byInstallerDay.set(key, arr);
  }

  const events: CalendarEvent[] = [
    // Delivery events visible only for non-installer roles
    ...(role === "installer" || !showDeliveries
      ? []
      : dRowsFiltered
          .filter((r) => r.plannedAt)
          .map((r) => ({
            id: r.id,
            title: `Dostawa – ${r.clientName ?? r.orderId.slice(0, 8)}`,
            start: toIsoDate(r.plannedAt!)!,
            href: fmtHref(r.orderId, r.orderNo ?? null, "delivery"),
            kind: "delivery" as const,
            clientName: r.clientName,
            orderNo: r.orderNo,
            phone: r.phone,
            address:
              r.orderLocationAddress || r.clientDeliveryAddress
                ? `${(r.orderLocationAddress ?? r.clientDeliveryAddress) || ""}${r.orderLocationCity || r.clientDeliveryCity ? `, ${r.orderLocationCity ?? r.clientDeliveryCity}` : ""}`
                : null,
            checklistDoneCount: doneByOrder.get(r.orderId) ?? 0,
          }))),
    ...(showInstallations ? iRowsFiltered : [])
      .filter((r) => r.plannedAt)
      .map((r) => ({
        id: r.id,
        title: `Montaż – ${r.clientName ?? r.orderId.slice(0, 8)}`,
        start: toIsoDate(r.plannedAt!)!,
        href: fmtHref(r.orderId, r.orderNo ?? null, "installation"),
        kind: "installation" as const,
        clientName: r.clientName,
        orderNo: r.orderNo,
        phone: r.phone,
        address:
          r.orderLocationAddress || r.clientDeliveryAddress
            ? `${(r.orderLocationAddress ?? r.clientDeliveryAddress) || ""}${r.orderLocationCity || r.clientDeliveryCity ? `, ${r.orderLocationCity ?? r.clientDeliveryCity}` : ""}`
            : null,
        checklistDoneCount: doneByOrder.get(r.orderId) ?? 0,
        installerId: r.installerId,
        googleSync: (googleByKey.has(`${r.orderId}::${r.installerId}`)
          ? "synced"
          : "pending") as "synced" | "pending",
        // collisions
        ...(() => {
          const day = toIsoDate(r.plannedAt!)!;
          const key = `${r.installerId ?? "none"}::${day}`;
          const list = byInstallerDay.get(key) || [];
          const others = list.filter((x) => x.id !== r.id);
          return others.length > 0
            ? {
                collision: true as const,
                colliding: others.map((o) => ({
                  orderNo: o.orderNo,
                  clientName: o.clientName,
                  href: fmtHref(o.orderId, o.orderNo ?? null, "installation"),
                })),
              }
            : {};
        })(),
      })),
  ];
  // Lista montażystów do filtra
  const installers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "installer"))
    .orderBy(asc(users.name));

  // Ustal wstępny widok i datę z query
  const initialView: "dayGridMonth" | "dayGridWeek" =
    view === "dayGridWeek" || range === "week" ? "dayGridWeek" : "dayGridMonth";
  const initialDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

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
        <div className="relative z-10 p-4 md:p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Kalendarz zleceń
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {role === "installer" ? null : (
              <CalendarFilters
                installers={installers}
                selectedInstaller={effectiveInstaller}
                kinds={
                  kindsFilter.length
                    ? kindsFilter
                    : ["installation", "delivery"]
                }
                statuses={
                  statusFilter.length ? statusFilter : ["planned", "confirmed"]
                }
                q={q}
                view={initialView}
              />
            )}
          </div>
        </div>
      </section>

      {/* Client calendar component */}
      <div
        className="rounded-md border"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <CalendarRoot
          events={events}
          initialView={initialView}
          initialDate={initialDate}
        />
      </div>
    </div>
  );
}

import { CalendarRoot } from "./calendar-root.client";
import { CalendarFilters } from "./calendar-filters.client";
