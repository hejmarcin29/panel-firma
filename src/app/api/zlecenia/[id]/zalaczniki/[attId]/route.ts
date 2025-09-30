import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { db } from "@/db";
import { orderAttachments, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createR2Client, getR2Bucket } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; attId: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user?.role;
    if (
      !role ||
      (role !== "admin" && role !== "manager" && role !== "installer")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, attId } = await ctx.params;
    // Ensure order exists
    const [ord] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!ord)
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });

    const [att] = await db
      .select()
      .from(orderAttachments)
      .where(
        and(eq(orderAttachments.id, attId), eq(orderAttachments.orderId, id)),
      )
      .limit(1);
    if (!att)
      return NextResponse.json(
        { error: "Nie znaleziono załącznika" },
        { status: 404 },
      );

    // Delete from R2 first (best-effort)
    try {
      const r2 = createR2Client();
      const bucket = getR2Bucket();
      await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: att.key }));
    } catch (e) {
      console.warn(
        "[DELETE attachment] Failed to delete from R2; continuing to remove DB row",
        e,
      );
    }

    await db.delete(orderAttachments).where(eq(orderAttachments.id, attId));

    revalidatePath(`/zlecenia/${id}`);
    revalidatePath("/zlecenia");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/zlecenia/:id/zalaczniki/:attId] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
