import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientInvites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isUserRole } from "@/lib/auth-session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  try {
    await db.delete(clientInvites).where(eq(clientInvites.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[public-invites] delete failed", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
