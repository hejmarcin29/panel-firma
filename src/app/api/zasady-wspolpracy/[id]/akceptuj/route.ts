import { NextResponse } from "next/server";
import { db } from "@/db";
import { cooperationRuleAcks, cooperationRules } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// POST /api/zasady-wspolpracy/:id/akceptuj
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || null;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const [rule] = await db
      .select()
      .from(cooperationRules)
      .where(eq(cooperationRules.id, id))
      .limit(1);
    if (!rule)
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    await db.insert(cooperationRuleAcks).values({
      id: randomUUID(),
      ruleId: id,
      userId,
      version: rule.version,
      acknowledgedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
