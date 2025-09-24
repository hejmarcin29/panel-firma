import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, clientNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET /api/clients/[id]
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, id))
    .orderBy(desc(clientNotes.createdAt));
  return NextResponse.json({ client, notes });
}

// DELETE /api/clients/[id]
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}
