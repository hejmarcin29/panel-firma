import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function OrderByNumberPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const normalized = (() => {
    const m = orderNo.match(/^(\d+_\d+)(?:_([md]))?$/i);
    if (m) return m[1];
    return orderNo;
  })();
  const [o] = await db
    .select({ id: orders.id, type: orders.type })
    .from(orders)
    .where(eq(orders.orderNo, normalized))
    .limit(1);
  if (!o) redirect("/montaz");
  redirect(o.type === "installation" ? `/montaz/${o.id}` : `/dostawa/${o.id}`);
}
