import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { installerPrivateTasks, orders } from "@/db/schema";
import { getSession } from "@/lib/auth-session";

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueAt: z.number().int().positive().optional().nullable(),
  relatedOrderId: z.string().uuid().optional().nullable(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  done: z.boolean().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dueAt: z.number().int().positive().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId || role !== "installer")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błędne dane", issues: parsed.error.issues },
        { status: 400 },
      );
    if (parsed.data.relatedOrderId) {
      const [assigned] = await db
        .select({ installerId: orders.installerId })
        .from(orders)
        .where(eq(orders.id, parsed.data.relatedOrderId))
        .limit(1);
      if (!assigned)
        return NextResponse.json(
          { error: "Zlecenie nie istnieje" },
          { status: 404 },
        );
      if (assigned.installerId !== userId)
        return NextResponse.json(
          { error: "To zlecenie nie jest do Ciebie przypisane" },
          { status: 403 },
        );
    }
    const id = randomUUID();
    await db.insert(installerPrivateTasks).values({
      id,
      userId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      relatedOrderId: parsed.data.relatedOrderId ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[POST /api/montazysta/zadania] Error", e);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId || role !== "installer")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błędne dane", issues: parsed.error.issues },
        { status: 400 },
      );
    const { id, ...rest } = parsed.data;
    const update: Record<string, unknown> = {};
    if (rest.done !== undefined) update.done = rest.done;
    if (rest.title !== undefined) update.title = rest.title;
    if (rest.description !== undefined) update.description = rest.description;
    if (rest.dueAt !== undefined)
      update.dueAt = rest.dueAt ? new Date(rest.dueAt) : null;
    update.updatedAt = new Date();
    await db
      .update(installerPrivateTasks)
      .set(update)
      .where(
        and(
          eq(installerPrivateTasks.id, id),
          eq(installerPrivateTasks.userId, userId),
        ),
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/montazysta/zadania] Error", e);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
