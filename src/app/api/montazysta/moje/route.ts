import { NextResponse } from "next/server";
import { orders, clients } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { eq, desc, and, isNull } from "drizzle-orm";

// Endpoint dynamiczny – bez prerenderu i bez otwierania DB w czasie builda
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") === "all" ? "all" : "active";
    const session = await getSession();
    const user = session?.user;
    if (!session || user?.role !== "installer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!user?.id) return NextResponse.json({ orders: [] });
    // Lazy import DB, aby uniknąć otwierania połączenia w czasie build-time
    const { db } = await import("@/db");
    const ordersList = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        clientName: clients.name,
        status: orders.status,
        preMeasurementSqm: orders.preMeasurementSqm,
        scheduledDate: orders.scheduledDate,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(
        scope === "active"
          ? and(
              eq(orders.installerId, user.id),
              isNull(orders.archivedAt),
              isNull(orders.outcome),
            )
          : eq(orders.installerId, user.id),
      )
      .orderBy(desc(orders.createdAt));
    // Znormalizuj pola dat na epoch ms (liczby), bo klient oczekuje number
    const normalized = ordersList.map((o) => ({
      ...o,
      createdAt:
        o.createdAt instanceof Date
          ? o.createdAt.getTime()
          : typeof o.createdAt === "number"
            ? o.createdAt
            : new Date(o.createdAt as unknown as string).getTime(),
      scheduledDate:
        o.scheduledDate == null
          ? null
          : o.scheduledDate instanceof Date
            ? o.scheduledDate.getTime()
            : typeof o.scheduledDate === "number"
              ? o.scheduledDate
              : new Date(o.scheduledDate as unknown as string).getTime(),
    }));
    return NextResponse.json({ orders: normalized });
  } catch (err) {
    console.error("[GET /api/montazysta/moje] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
