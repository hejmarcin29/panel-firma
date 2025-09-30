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
  // Przyjmujemy zarówno format bez sufiksu (np. "12_3") jak i z sufiksem typu: "12_3_m" / "12_3_d"
  // Sufiks jest ignorowany przy wyszukiwaniu, służy tylko do przyjaznego adresu.
  const normalized = (() => {
    const m = orderNo.match(/^(\d+_\d+)(?:_([md]))?$/i);
    if (m) return m[1];
    return orderNo; // fallback – próbujemy jak jest
  })();
  const [o] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNo, normalized))
    .limit(1);
  if (!o) redirect("/zlecenia");
  redirect(`/zlecenia/${o.id}`);
}
