import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientInvites, clients } from "@/db/schema";
import { getSession, isUserRole } from "@/lib/auth-session";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(clientInvites)
    .orderBy(desc(clientInvites.createdAt))
    .limit(200);

  const out = await Promise.all(
    rows.map(async (r) => {
      const now = Date.now();
  const expiresAtMs = r.expiresAt instanceof Date ? r.expiresAt.getTime() : (r.expiresAt as number | null);
      const remainingDays = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - now) / (24 * 60 * 60 * 1000))) : null;
      let clientName: string | null = null;
      if (r.resultClientId) {
        const c = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, r.resultClientId))
          .limit(1);
        clientName = c[0]?.name ?? null;
      } else if (r.clientId) {
        const c = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, r.clientId))
          .limit(1);
        clientName = c[0]?.name ?? null;
      }
      return {
        id: r.id,
        token: r.token,
        purpose: r.purpose,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        usedAt: r.usedAt,
        remainingDays,
        clientId: r.clientId,
        resultClientId: r.resultClientId,
        resultClientName: clientName,
      };
    }),
  );

  return NextResponse.json({ invites: out });
}
