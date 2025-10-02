import type { Metadata } from "next";
import { db } from "@/db";
import { orders, clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const rows = await db
      .select({
        orderNo: orders.orderNo,
        clientName: clients.name,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id));
    const r = rows[0];
    const parts = [
      r?.orderNo ? `Zlecenie ${r.orderNo}` : "Zlecenie",
      r?.clientName ? `– ${r.clientName}` : "",
    ];
    return { title: parts.join(" ").trim() };
  } catch {
    return { title: "Zlecenie" };
  }
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
