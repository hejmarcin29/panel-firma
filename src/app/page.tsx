import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Users,
  ClipboardList,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { pl } from "@/i18n/pl";
import Link from "next/link";
import { DailyGoalDialog } from "@/components/daily-goal-dialog.client";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import {
  orders as ordersTable,
  clients as clientsTbl,
  appSettings,
} from "@/db/schema";
import {
  and,
  gte,
  lte,
  eq as deq,
  asc,
  desc,
  ne,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { KpiCard } from "@/components/kpi-card";
import { MiniSparkline } from "@/components/mini-sparkline";
import { CircularGauge } from "@/components/circular-gauge";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    redirect("/panel/montazysta");
  }
  // Fetch small analytics for KPIs
  const [clientsCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(clientsTbl);
  const [activeOrdersCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(ordersTable)
    .where(
      and(
        ne(ordersTable.status, "completed"),
        ne(ordersTable.status, "cancelled"),
        isNull(ordersTable.archivedAt),
      ),
    );

  const now = new Date();
  const weekAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
  );
  const [completedWeek] = await db
    .select({ c: sql<number>`count(*)` })
    .from(ordersTable)
    .where(
      and(
        deq(ordersTable.status, "completed"),
        gte(ordersTable.scheduledDate, weekAgo),
      ),
    );

  const weekAhead = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
  );
  const [upcomingWeek] = await db
    .select({ c: sql<number>`count(*)` })
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.scheduledDate, now),
        lte(ordersTable.scheduledDate, weekAhead),
        isNull(ordersTable.archivedAt),
      ),
    );

  // Trendy (14 dni): liczba zaplanowanych zleceń per dzień + statystyki typów
  const trendDays = 14;
  const startTrend = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (trendDays - 1),
  );
  const rows = await db
    .select({ d: ordersTable.scheduledDate, t: ordersTable.type })
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.scheduledDate, startTrend),
        isNull(ordersTable.archivedAt),
      ),
    );
  const counts = Array.from({ length: trendDays }, () => 0);
  let totalInstallations = 0;
  let totalDeliveries = 0;
  for (const r of rows) {
    if (!r.d) continue;
    const idx = Math.floor(
      (new Date(r.d).getTime() - startTrend.getTime()) / (24 * 3600 * 1000),
    );
    if (idx >= 0 && idx < trendDays) counts[idx]++;
    if (r.t === "installation") totalInstallations++;
    if (r.t === "delivery") totalDeliveries++;
  }

  // Ustawialny cel dzienny (domyślnie 2/dzień)
  const goalRow = await db
    .select({ v: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "daily_goal"))
    .limit(1);
  const dailyGoal = (() => {
    const n = parseInt(goalRow[0]?.v ?? "2", 10);
    return Number.isFinite(n) && n > 0 ? n : 2;
  })();
  const goalTotal = trendDays * dailyGoal;
  const achievedPct = Math.min(
    100,
    Math.round((counts.reduce((a, b) => a + b, 0) / (goalTotal || 1)) * 100),
  );

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)]"
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
            {pl.dashboard.title}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/klienci/nowy"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
              style={{ borderColor: "var(--pp-border)" }}
            >
              <Plus className="h-4 w-4" /> {pl.clients.add}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Klienci"
          value={clientsCount?.c ?? 0}
          delta={{ value: 4 }}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Aktywne zlecenia"
          value={activeOrdersCount?.c ?? 0}
          delta={{ value: 2 }}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="Zakończone (7 dni)"
          value={completedWeek?.c ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Najbliższy tydzień"
          value={upcomingWeek?.c ?? 0}
          icon={<Calendar className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Założenia (14 dni)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <MiniSparkline
                points={counts}
                width={520}
                height={96}
                stroke="var(--pp-primary)"
                responsive
              />
              <div
                className="rounded-xl border p-3 self-stretch sm:self-auto"
                style={{ borderColor: "var(--pp-border)" }}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-xs opacity-70">Wykonanie celu</div>
                  <DailyGoalDialog />
                </div>
                <CircularGauge value={achievedPct} />
                <div className="mt-2 text-xs opacity-70">
                  Cel: {dailyGoal}/dzień • Suma:{" "}
                  {counts.reduce((a, b) => a + b, 0)} / {goalTotal}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Montaże: {totalInstallations} • Dostawy: {totalDeliveries}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{pl.dashboard.recentClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentClients />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{pl.dashboard.recentChanges}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentChanges />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{pl.dashboard.jobsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-2 text-sm font-medium">Najbliższe</div>
                <UpcomingOrders />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">
                  Ostatnio zakończone
                </div>
                <RecentCompletedOrders />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import {
  clients as clientsTable,
  clientNotes as clientNotesTable,
} from "@/db/schema";

async function RecentClients() {
  const list = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      email: clientsTable.email,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt))
    .limit(5);
  if (list.length === 0)
    return (
      <p className="text-sm opacity-70">
        {pl.dashboard.noneClients}{" "}
        <Link
          className="hover:underline focus:underline focus:outline-none"
          href="/klienci/nowy"
        >
          {pl.dashboard.addFirst}
        </Link>
        .
      </p>
    );
  return (
    <ul className="space-y-1 text-sm">
      {list.map((c) => (
        <li key={c.id} className="flex items-center justify-between">
          <Link
            className="hover:underline focus:underline focus:outline-none"
            href={`/klienci/${c.id}`}
          >
            {c.name}
          </Link>
          <span className="opacity-60">{formatDate(c.createdAt)}</span>
        </li>
      ))}
      <li className="mt-2">
        <Link
          className="hover:underline focus:underline focus:outline-none"
          href="/klienci"
        >
          {pl.dashboard.seeAll}
        </Link>
      </li>
    </ul>
  );
}

async function RecentChanges() {
  const notes = await db
    .select({
      id: clientNotesTable.id,
      clientId: clientNotesTable.clientId,
      content: clientNotesTable.content,
      createdAt: clientNotesTable.createdAt,
    })
    .from(clientNotesTable)
    .orderBy(desc(clientNotesTable.createdAt))
    .limit(5);
  if (notes.length === 0)
    return <p className="text-sm opacity-70">Brak zmian.</p>;
  // Fetch client names for each note (simple approach; for SQLite short list it's fine)
  const nameById = new Map<string, string>();
  for (const n of notes) {
    if (!nameById.has(n.clientId)) {
      const row = await db
        .select({ name: clientsTable.name })
        .from(clientsTable)
        .where(eq(clientsTable.id, n.clientId))
        .limit(1);
      if (row[0]?.name) nameById.set(n.clientId, row[0].name);
    }
  }
  return (
    <ul className="space-y-1 text-sm">
      {notes.map((n) => (
        <li key={n.id} className="flex items-center justify-between gap-3">
          <span className="truncate max-w-[70%]">
            <span className="opacity-70">
              {nameById.get(n.clientId) || "Klient"}
            </span>
            <span className="opacity-50"> • </span>
            <span className="">{n.content}</span>
          </span>
          <span className="opacity-60">{formatDate(n.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

async function UpcomingOrders() {
  // Normalize today to local midnight
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const rows = await db
    .select({
      id: ordersTable.id,
      clientId: ordersTable.clientId,
      scheduledDate: ordersTable.scheduledDate,
      status: ordersTable.status,
      clientName: clientsTbl.name,
      type: ordersTable.type,
      orderNo: ordersTable.orderNo,
    })
    .from(ordersTable)
    .leftJoin(clientsTbl, deq(ordersTable.clientId, clientsTbl.id))
    .where(
      and(
        gte(ordersTable.scheduledDate, todayStart),
        ne(ordersTable.status, "completed"),
        ne(ordersTable.status, "cancelled"),
        isNull(ordersTable.archivedAt),
      ),
    )
    .orderBy(asc(ordersTable.scheduledDate))
    .limit(5);

  if (!rows || rows.length === 0)
    return (
      <p className="text-sm text-gray-600">{pl.dashboard.jobsPlaceholder}</p>
    );
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              className="hover:underline focus:underline focus:outline-none"
              href={
                r.orderNo
                  ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                  : `/zlecenia/${r.id}`
              }
            >
              {r.clientName || r.clientId}
            </Link>
            <span className="text-xs rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
              {r.type === "installation" ? "Montaż" : "Dostawa"}
            </span>
          </div>
          <span className="opacity-60">{formatDate(r.scheduledDate, "-")}</span>
        </li>
      ))}
    </ul>
  );
}

async function RecentCompletedOrders() {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const rows = await db
    .select({
      id: ordersTable.id,
      clientId: ordersTable.clientId,
      scheduledDate: ordersTable.scheduledDate,
      status: ordersTable.status,
      clientName: clientsTbl.name,
      type: ordersTable.type,
      orderNo: ordersTable.orderNo,
    })
    .from(ordersTable)
    .leftJoin(clientsTbl, deq(ordersTable.clientId, clientsTbl.id))
    .where(
      and(
        deq(ordersTable.status, "completed"),
        lte(ordersTable.scheduledDate, todayStart),
        isNull(ordersTable.archivedAt),
      ),
    )
    .orderBy(desc(ordersTable.scheduledDate))
    .limit(5);

  if (!rows || rows.length === 0)
    return <p className="text-sm text-gray-600">Brak zakończonych.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              className="hover:underline focus:underline focus:outline-none"
              href={
                r.orderNo
                  ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                  : `/zlecenia/${r.id}`
              }
            >
              {r.clientName || r.clientId}
            </Link>
            <span className="text-xs rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
              {r.type === "installation" ? "Montaż" : "Dostawa"}
            </span>
          </div>
          <span className="opacity-60">{formatDate(r.scheduledDate, "-")}</span>
        </li>
      ))}
    </ul>
  );
}
