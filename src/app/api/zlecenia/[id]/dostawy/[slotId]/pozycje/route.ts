import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { deliveryItems, deliverySlots } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";

// GET: lista pozycji dla slotu dostawy
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; slotId: string }> },
) {
  try {
    const { id, slotId } = await ctx.params;
    // Weryfikuj, że slot należy do zlecenia
    const [slot] = await db
      .select({ id: deliverySlots.id })
      .from(deliverySlots)
      .where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.orderId, id)))
      .limit(1);
    if (!slot)
      return NextResponse.json(
        { error: "Nie znaleziono slotu" },
        { status: 404 },
      );

    const items = await db
      .select()
      .from(deliveryItems)
      .where(eq(deliveryItems.slotId, slotId));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/zlecenia/:id/dostawy/:slotId/pozycje] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(500),
  sqm: z.union([z.string(), z.number()]).optional(),
  packs: z.union([z.string(), z.number()]).optional(),
});

// POST: dodaj pozycję do slotu
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; slotId: string }> },
) {
  try {
    const session = await getSession();
    const role = session?.user?.role;
    if (!session || (role !== "admin" && role !== "manager"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, slotId } = await ctx.params;
    // Weryfikuj slot -> zlecenie
    const [slot] = await db
      .select({ id: deliverySlots.id })
      .from(deliverySlots)
      .where(and(eq(deliverySlots.id, slotId), eq(deliverySlots.orderId, id)))
      .limit(1);
    if (!slot)
      return NextResponse.json(
        { error: "Nie znaleziono slotu" },
        { status: 404 },
      );

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błąd walidacji", issues: parsed.error.issues },
        { status: 400 },
      );

    const toSqmCenti = (v: unknown) => {
      if (v == null || v === "") return null;
      const s = String(v).replace(",", ".").trim();
      const num = Number(s);
      return Number.isFinite(num) ? Math.round(num * 100) : null;
    };
    const toInt = (v: unknown) => {
      if (v == null || v === "") return null;
      const num = Number(String(v).trim());
      return Number.isFinite(num) ? Math.round(num) : null;
    };

    await db.insert(deliveryItems).values({
      id: crypto.randomUUID(),
      slotId,
      name: parsed.data.name.trim(),
      sqmCenti: toSqmCenti(parsed.data.sqm),
      packs: toInt(parsed.data.packs),
      createdAt: new Date(),
    });

    revalidatePath(`/zlecenia/${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[POST /api/zlecenia/:id/dostawy/:slotId/pozycje] Error",
      err,
    );
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
