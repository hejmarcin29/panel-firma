import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientInvites, clients, orders } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

async function getValidPreviewInvite(token: string) {
  const rows = await db
    .select()
    .from(clientInvites)
    .where(and(eq(clientInvites.token, token), isNull(clientInvites.usedAt)));
  const inv = rows[0];
  if (!inv || inv.purpose !== "order_preview") return null;
  const now = Date.now();
  const exp = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : (inv.expiresAt as number | null);
  if (exp && exp < now) return null;
  return inv;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getValidPreviewInvite(token);
  if (!inv || !inv.orderId || !inv.clientId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [orderRow] = await db
    .select({
      id: orders.id,
      type: orders.type,
      pipelineStage: orders.pipelineStage,
      orderNo: orders.orderNo,
      scheduledDate: orders.scheduledDate,
      locationCity: orders.locationCity,
      locationPostalCode: orders.locationPostalCode,
      locationAddress: orders.locationAddress,
    })
    .from(orders)
    .where(eq(orders.id, inv.orderId))
    .limit(1);

  if (!orderRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [clientRow] = await db
    .select({
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      companyName: clients.companyName,
      buyerType: clients.buyerType,
      taxId: clients.taxId,
      invoiceCity: clients.invoiceCity,
      invoicePostalCode: clients.invoicePostalCode,
      invoiceAddress: clients.invoiceAddress,
      invoiceEmail: clients.invoiceEmail,
      preferVatInvoice: clients.preferVatInvoice,
    })
    .from(clients)
    .where(eq(clients.id, inv.clientId))
    .limit(1);

  return NextResponse.json({
    order: orderRow,
    client: clientRow ?? null,
    allowEdit: !!inv.allowEdit,
    expiresAt: inv.expiresAt ?? null,
  });
}
