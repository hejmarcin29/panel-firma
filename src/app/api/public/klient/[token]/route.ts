import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientInvites, clients, orders } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

async function getPortalInvite(token: string) {
  const rows = await db
    .select()
    .from(clientInvites)
    .where(and(eq(clientInvites.token, token), eq(clientInvites.purpose, "portal")));
  const inv = rows[0];
  if (!inv) return null;
  const now = Date.now();
  const exp = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : (inv.expiresAt as number | null);
  // Wymagamy ważnej daty wygaśnięcia w przyszłości dla linków portalu
  if (!exp || exp <= now) return null;
  return inv;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getPortalInvite(token);
  if (!inv || !inv.clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clientRows = await db.select().from(clients).where(eq(clients.id, inv.clientId)).limit(1);
  const c = clientRows[0];
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orderRows = await db
    .select({
      id: orders.id,
      type: orders.type,
      pipelineStage: orders.pipelineStage,
      orderNo: orders.orderNo,
      scheduledDate: orders.scheduledDate,
      locationCity: orders.locationCity,
      locationPostalCode: orders.locationPostalCode,
      locationAddress: orders.locationAddress,
      createdAt: orders.createdAt,
      outcome: orders.outcome,
    })
    .from(orders)
    .where(and(eq(orders.clientId, c.id), isNull(orders.archivedAt)))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({
    client: {
      name: c.name,
      phone: c.phone,
      email: c.email,
      buyerType: c.buyerType,
      companyName: c.companyName,
      taxId: c.taxId,
      invoiceCity: c.invoiceCity,
      invoicePostalCode: c.invoicePostalCode,
      invoiceAddress: c.invoiceAddress,
      invoiceEmail: c.invoiceEmail,
      preferVatInvoice: c.preferVatInvoice,
    },
    orders: orderRows,
    portal: { token: inv.token, createdAt: inv.createdAt, expiresAt: inv.expiresAt },
  });
}
