import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientNotes } from "@/db/schema";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

interface NoteBody { content?: string; [k: string]: unknown }

// POST /api/clients/[id]/notes
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null) as unknown;
  const body: NoteBody = raw && typeof raw === 'object' ? raw as NoteBody : {};
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) return NextResponse.json({ error: "Treść wymagana" }, { status: 400 });

  const id = randomUUID();
  await db.insert(clientNotes).values({
    id,
    clientId: params.id,
    content,
    createdBy: session.user?.email ?? null,
  });
  return NextResponse.json({ id });
}
