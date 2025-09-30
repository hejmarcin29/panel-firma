import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId) {
      return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
    }
    // Installer może odłączyć swoje konto; admin także (na przyszłość można dodać parametr userId do adminowego widoku)
    if (role !== "installer" && role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    await db
      .delete(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Błąd";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
