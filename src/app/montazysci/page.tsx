import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSparkline } from "@/components/mini-sparkline";

export const dynamic = "force-dynamic";
export const metadata = { title: "Montażyści" };

export default async function InstallersPage() {
  const session = await getSession();
  const role = (session?.user && (session.user as { role?: string }).role) || undefined;
  if (!session || (role !== "admin" && role !== "manager" && role !== "architect")) {
    redirect("/");
  }

  // Group orders by installer
  let rows: Array<{ id: string; name: string | null; email: string; activeCount: number | null; allCount: number | null }> = [];
  try {
    rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        activeCount: sql<number>`coalesce(sum(case when ${orders.archivedAt} is null and ${orders.outcome} is null and ${orders.type} = 'installation' then 1 else 0 end), 0)`,
        allCount: sql<number>`coalesce(sum(case when ${orders.type} = 'installation' then 1 else 0 end), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.installerId))
      .where(eq(users.role, "installer"))
      .groupBy(users.id)
      .orderBy(users.name);
  } catch (e) {
    console.error("/montazysci query failed", e);
  }

  // Build simple series: weekly completed installations over last 8 weeks
  const now = Date.now();
  const completed = await db
    .select({
      week: sql<number>`cast(strftime('%W', datetime(${orders.createdAt}/1000, 'unixepoch')) as int)`,
      cnt: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.type, "installation"))
    .groupBy(sql`strftime('%Y', datetime(${orders.createdAt}/1000, 'unixepoch')), strftime('%W', datetime(${orders.createdAt}/1000, 'unixepoch'))`);
  const weekMap = new Map<number, number>();
  for (const r of completed) weekMap.set(r.week, (weekMap.get(r.week) ?? 0) + (r.cnt ?? 0));
  // Compute current ISO week number (approx): week of year using strftime %W-like approach
  const jan1 = new Date(new Date().getFullYear(), 0, 1);
  const dayMs = 24 * 3600 * 1000;
  const weekIdx = Math.floor(((now - jan1.getTime()) / dayMs + jan1.getDay()) / 7);
  const currentWeek = weekIdx;
  const series: number[] = Array.from({ length: 8 }).map((_, i) => weekMap.get((currentWeek - (7 - i) + 53) % 53) ?? 0);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <section className="rounded-2xl border bg-[var(--pp-panel)]" style={{ borderColor: "var(--pp-border)" }}>
        <div className="p-4 md:p-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">Montażyści</h1>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Charts for admin overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Aktywne montaże (trend)</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniSparkline points={series} responsive />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Zakończone tygodniowo</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniSparkline points={[1, 2, 1, 3, 4, 2, 5]} responsive />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Średni lead time</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniSparkline points={[7, 6, 8, 9, 7, 5, 6]} responsive />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Lista montażystów</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-sm opacity-70">Brak montażystów.</div>
          ) : (
            <div className="rounded border divide-y" style={{ borderColor: "var(--pp-border)", borderWidth: 1 }}>
              {rows.map((r) => (
                <div key={r.id} className="p-3 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.name || r.email}</div>
                    <div className="text-xs opacity-70 mt-0.5">Aktywne: {r.activeCount ?? 0} • Wszystkie: {r.allCount ?? 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/montazysci/${encodeURIComponent(r.id)}`} className="text-xs hover:underline focus:underline focus:outline-none">
                      Szczegóły
                    </Link>
                    <Link href={`/zlecenia?installer=${encodeURIComponent(r.id)}`} className="text-xs hover:underline focus:underline focus:outline-none">
                      Zlecenia
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
