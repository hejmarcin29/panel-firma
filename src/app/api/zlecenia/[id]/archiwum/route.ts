import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const role = session?.user?.role as string | undefined;
  if (!session || role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await db
    .update(orders)
    .set({ archivedAt: new Date() })
    .where(eq(orders.id, id));
  revalidatePath("/zlecenia");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

// DELETE /api/zlecenia/:id/archiwum → cofnięcie archiwum
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const role = session?.user?.role as string | undefined;
  if (!session || role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await db.update(orders).set({ archivedAt: null }).where(eq(orders.id, id));
  revalidatePath("/zlecenia");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
