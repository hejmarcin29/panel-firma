import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { db } from "@/db";
import { clientInvites, orders } from "@/db/schema";
import { getSession, isUserRole } from "@/lib/auth-session";
import { eq } from "drizzle-orm";

function makeToken() {
  return randomBytes(24).toString("base64url");
}

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const creator = session?.user?.email ?? null;

  // Validate order exists
  const row = await db.select({ id: orders.id, clientId: orders.clientId, type: orders.type }).from(orders).where(eq(orders.id, orderId)).limit(1);
  const ord = row[0];
  if (!ord) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const token = makeToken();
  const invId = randomUUID();
  const now = Date.now();
  const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(clientInvites).values({
    id: invId,
    token,
    purpose: "order_preview",
    clientId: ord.clientId,
    orderId: ord.id,
    allowEdit: false,
    expiresAt,
    createdBy: creator,
    createdAt: new Date(now),
  });

  const origin = new URL("/", _req.url).origin;
  const path = ord.type === "installation" ? "/public/montaz/" : "/public/dostawa/";
  const url = `${origin}${path}${encodeURIComponent(token)}`;
  return NextResponse.json({ id: invId, token, url, expiresAt: expiresAt.getTime() });
}
