import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clientNotes } from "@/db/schema";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface NoteCreateBody { content?: string; [k: string]: unknown }

// POST /api/klienci/[id]/notatki
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null) as unknown;
  const body: NoteCreateBody | null = raw && typeof raw === 'object' ? raw as NoteCreateBody : null;
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content) return NextResponse.json({ error: "Treść wymagana" }, { status: 400 });

  const id = randomUUID();
  await db.insert(clientNotes).values({ id, clientId, content, createdBy: session.user?.email ?? null });
  await emitDomainEvent({
    type: DomainEventTypes.clientNoteAdded,
    actor: session.user?.email ?? null,
    entity: { type: 'client', id: clientId },
    payload: { id, clientId },
  });
  return NextResponse.json({ id });
}
