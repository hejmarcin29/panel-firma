import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({ id: orders.id, type: orders.type })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) redirect("/zlecenia");
  redirect(row.type === "installation" ? `/montaz/${row.id}` : `/dostawa/${row.id}`);
}
