import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientInvites } from "@/db/schema";
import { getSession, isUserRole } from "@/lib/auth-session";
import { and, eq } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";

function makeToken() {
  return randomBytes(24).toString("base64url");
}

// POST: create (or return existing) portal link. If ?rotate=1 present, revoke existing and create a new one.
export async function POST(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const creator = session?.user?.email ?? null;

  const url = new URL(req.url);
  const rotate = url.searchParams.get("rotate") === "1";
  // TTL in days for portal link (default 90, range 1..365)
  const daysParam = url.searchParams.get("days");
  const days = (() => {
    const n = daysParam ? Number(daysParam) : 90;
    if (!Number.isFinite(n)) return 90;
    return Math.min(365, Math.max(1, Math.floor(n)));
  })();
  const now = Date.now();
  const newExpiresAt = new Date(now + days * 24 * 60 * 60 * 1000);

  if (rotate) {
    // revoke all existing portal links for this client
    await db
      .update(clientInvites)
      .set({ expiresAt: new Date(0) })
      .where(and(eq(clientInvites.clientId, clientId), eq(clientInvites.purpose, "portal")));
  } else {
    // check if any active portal link exists
    const existing = await db
      .select()
      .from(clientInvites)
      .where(and(eq(clientInvites.clientId, clientId), eq(clientInvites.purpose, "portal")));
    const active = existing.find((x) => {
      const exp = x.expiresAt instanceof Date ? x.expiresAt.getTime() : (x.expiresAt as number | null);
      return !!exp && exp > now; // aktywny tylko gdy ma przyszłą datę wygaśnięcia
    });
    if (active) {
      const origin = new URL("/", req.url).origin;
      const url = `${origin}/public/klient/${encodeURIComponent(active.token)}`;
      const exp = active.expiresAt instanceof Date ? active.expiresAt.getTime() : (active.expiresAt as number | null);
      return NextResponse.json({ id: active.id, token: active.token, url, expiresAt: exp });
    }
  }

  const token = makeToken();
  const id = randomUUID();
  await db.insert(clientInvites).values({
    id,
    token,
    purpose: "portal",
    clientId,
    allowEdit: false,
    expiresAt: newExpiresAt,
    createdAt: new Date(),
    createdBy: creator,
  });
  const origin = new URL("/", req.url).origin;
  const publicUrl = `${origin}/public/klient/${encodeURIComponent(token)}`;
  return NextResponse.json({ id, token, url: publicUrl, expiresAt: newExpiresAt.getTime() });
}

// DELETE: revoke all portal links for a client
export async function DELETE(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(clientInvites)
    .set({ expiresAt: new Date(0) })
    .where(and(eq(clientInvites.clientId, clientId), eq(clientInvites.purpose, "portal")));
  return NextResponse.json({ ok: true });
}
