import { db } from "@/db";
import { users, orders, clients } from "@/db/schema";
import { and, eq, asc, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarRoot } from "@/app/zlecenia/kalendarz/calendar-root.client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Montażysta" };

export default async function InstallerDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const role = (session?.user && (session.user as { role?: string }).role) || undefined;
  if (!session || (role !== "admin" && role !== "manager" && role !== "architect")) {
    redirect("/");
  }
  const person = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  if (person.length === 0) redirect("/montazysci");

  // Stage 1: use orders.scheduledDate + installerId only
  const slots = await db
    .select({
      id: orders.id,
      orderId: orders.id,
      plannedAt: orders.scheduledDate,
      status: orders.status,
      clientName: clients.name,
      orderNo: orders.orderNo,
      phone: clients.phone,
      orderLocationCity: orders.locationCity,
      orderLocationAddress: orders.locationAddress,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(and(eq(orders.type, "installation"), eq(orders.installerId, id), isNotNull(orders.scheduledDate)))
    .orderBy(asc(orders.scheduledDate));

  const toIsoDate = (v: number | Date | null) => {
    if (!v) return undefined;
    const d = v instanceof Date ? v : new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const events = slots.filter((r) => r.plannedAt).map((r) => ({
    id: r.id,
    title: `Montaż – ${r.clientName ?? r.orderId.slice(0, 8)}`,
    start: toIsoDate(r.plannedAt!)!,
    href: r.orderNo ? `/montaz/nr/${r.orderNo}_m` : `/montaz/${r.orderId}`,
    kind: "installation" as const,
  }));

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <section className="rounded-2xl border bg-[var(--pp-panel)]" style={{ borderColor: "var(--pp-border)" }}>
        <div className="p-4 md:p-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">{person[0].name || person[0].email}</h1>
            <div className="text-xs opacity-70">Kalendarz i statystyki montażysty</div>
          </div>
          <Link href="/montazysci" className="text-sm hover:underline">Wróć</Link>
        </div>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Kalendarz montaży</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border" style={{ borderColor: "var(--pp-border)" }}>
            <CalendarRoot events={events} initialView="dayGridMonth" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Najbliższe montaże</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-sm opacity-70">Brak zaplanowanych montaży.</div>
          ) : (
            <div className="divide-y rounded border" style={{ borderColor: "var(--pp-border)" }}>
              {slots.map((s) => (
                <div key={s.id} className="p-3 text-sm flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.clientName || s.orderId}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      Ustalona data montażu: {s.plannedAt ? toIsoDate(s.plannedAt) : "—"}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Link href={s.orderNo ? `/montaz/nr/${s.orderNo}_m` : `/montaz/${s.orderId}`} className="text-xs hover:underline">Szczegóły</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Statystyki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm opacity-70">(Wkrótce) liczba montaży / tydzień, średni lead time, obciążenie.</div>
        </CardContent>
      </Card>
    </div>
  );
}
