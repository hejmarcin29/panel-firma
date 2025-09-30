import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { z } from "zod";
import { hash } from "@/lib/hash";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

const bodySchema = z.object({
  password: z.string().min(12, "Minimum 12 znaków"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const role = session?.user?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Błąd walidacji", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { id: userId } = await params;
    const passwordHash = await hash(parsed.data.password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await emitDomainEvent({
      type: DomainEventTypes.userPasswordChanged,
      actor: session?.user?.email ?? "system",
      entity: { type: "user", id: userId },
      payload: { id: userId },
      schemaVersion: 1,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/uzytkownicy/:id/haslo] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
