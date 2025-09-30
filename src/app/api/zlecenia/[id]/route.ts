import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, clients } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { upsertOrderEvent, deleteOrderEvent } from "@/lib/google-calendar";

interface SessionUser {
  user?: { email?: string | null } | null;
}

// Allowed transitions simple map (from -> set of to)
const ALLOWED: Record<string, string[]> = {
  awaiting_measurement: ["ready_to_schedule", "cancelled"],
  ready_to_schedule: ["scheduled", "cancelled"],
  scheduled: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// GET /api/zlecenia/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!order)
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[GET /api/zlecenia/:id] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

const patchSchema = z.object({ status: z.string() });

// PATCH /api/zlecenia/:id  body { status }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const userEmail = (session as SessionUser | null)?.user?.email ?? null;
    const userRole =
      (session as SessionUser & { user?: { role?: string | null } })?.user
        ?.role ?? null;
    const userId =
      (session as { user?: { id?: string | null } })?.user?.id ?? null;
    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błąd walidacji", issues: parsed.error.issues },
        { status: 400 },
      );
    const newStatus = parsed.data.status;
    const { id } = await params;
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!order)
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    if (order.outcome)
      return NextResponse.json(
        { error: "Nie można zmienić statusu po ustawieniu wyniku" },
        { status: 409 },
      );
    if (order.status === newStatus) return NextResponse.json({ ok: true });
    const allowed = ALLOWED[order.status] || [];
    // Role-aware constraints: admin -> full allowed; installer -> limited on own orders only
    const isAdmin = userRole === "admin";
    const isInstaller =
      userRole === "installer" && userId && order.installerId === userId;
    let roleAllowed = false;
    if (isAdmin) {
      roleAllowed = true;
    } else if (isInstaller) {
      // Installer can mark measurement done and completion
      const okInstaller =
        (order.status === "awaiting_measurement" &&
          newStatus === "ready_to_schedule") ||
        (order.status === "scheduled" && newStatus === "completed");
      roleAllowed = okInstaller;
    }
    if (!allowed.includes(newStatus) || !roleAllowed) {
      return NextResponse.json(
        { error: "Niedozwolona zmiana statusu" },
        { status: 403 },
      );
    }
    await db.update(orders).set({ status: newStatus }).where(eq(orders.id, id));
    // Sync calendar on status change
    if (newStatus === "completed" || newStatus === "cancelled") {
      await deleteOrderEvent({ orderId: id });
    } else if (newStatus === "scheduled") {
      await upsertOrderEvent({ orderId: id });
    }
    // fetch numbers for enriched payload
    const rows = await db
      .select({ clientNo: clients.clientNo, orderNo: orders.orderNo })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))
      .limit(1);
    const withNo = rows[0];
    await emitDomainEvent({
      type: DomainEventTypes.orderStatusChanged,
      actor: userEmail,
      entity: { type: "order", id },
      payload: {
        id,
        from: order.status,
        to: newStatus,
        clientNo: withNo?.clientNo ?? null,
        orderNo: withNo?.orderNo ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/zlecenia/:id] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
