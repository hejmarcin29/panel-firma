import type { Metadata } from "next";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const rows = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, id));
    const name = rows[0]?.name?.trim();
    return { title: name ? `Klient: ${name}` : "Szczegóły klienta" };
  } catch {
    return { title: "Szczegóły klienta" };
  }
}

export default function ClientDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
