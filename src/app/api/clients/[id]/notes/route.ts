import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientNotes } from "@/db/schema";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth-session";

interface NoteBody {
  content?: string;
  [k: string]: unknown;
}

// POST /api/clients/[id]/notes
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: NoteBody =
    raw && typeof raw === "object" ? (raw as NoteBody) : {};
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content)
    return NextResponse.json({ error: "Treść wymagana" }, { status: 400 });

  const id = randomUUID();
  await db.insert(clientNotes).values({
    id,
    clientId: (await ctx.params).id,
    content,
    createdBy: session.user?.email ?? null,
  });
  return NextResponse.json({ id });
}
