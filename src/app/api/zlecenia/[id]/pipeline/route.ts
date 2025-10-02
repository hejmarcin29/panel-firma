import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { clients, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";
import { revalidatePath } from "next/cache";
import { getProjectSettings } from "@/app/actions/project-settings";
type Stage = string;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const role = session?.user?.role ?? null;
    const actor = session?.user?.email ?? null;
    if (!session || (role !== "admin" && role !== "manager"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;
    const json = await req.json().catch(() => null);
    const bodySchema = z.object({ stage: z.string().min(1) });
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błąd walidacji", issues: parsed.error.issues },
        { status: 400 },
      );

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!order)
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    if (order.outcome)
      return NextResponse.json(
        { error: "Zamknięte zlecenie" },
        { status: 409 },
      );

    const settings = await getProjectSettings();
    const allowedStages: readonly Stage[] =
      order.type === "delivery"
        ? settings.pipelineStages.delivery.map((e) => e.key)
        : settings.pipelineStages.installation.map((e) => e.key);
    const to = parsed.data.stage;
    if (!allowedStages.includes(to))
      return NextResponse.json(
        { error: "Nieprawidłowy etap" },
        { status: 400 },
      );

    await db
      .update(orders)
      .set({ pipelineStage: to, pipelineStageUpdatedAt: new Date() })
      .where(eq(orders.id, id));

    const rows = await db
      .select({ clientNo: clients.clientNo, orderNo: orders.orderNo })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))
      .limit(1);
    const nums = rows[0];

    await emitDomainEvent({
      type: DomainEventTypes.orderPipelineChanged,
      actor,
      entity: { type: "order", id },
      payload: {
        id,
        from:
          (order as { pipelineStage?: string | null }).pipelineStage ?? null,
        to,
        type: order.type as "delivery" | "installation",
        clientNo: nums?.clientNo ?? null,
        orderNo: nums?.orderNo ?? null,
      },
    });

    revalidatePath(`/zlecenia/${id}`);
    revalidatePath("/zlecenia");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/zlecenia/:id/pipeline] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
