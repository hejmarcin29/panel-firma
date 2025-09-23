import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientNotes } from "@/db/schema";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// POST /api/clients/[id]/notes
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = (body.content || "").trim();
  if (!content) return NextResponse.json({ error: "Treść wymagana" }, { status: 400 });

  const id = randomUUID();
  const s: any = session as any;
  await db.insert(clientNotes).values({
    id,
    clientId: params.id,
    content,
    createdBy: s?.user?.email ?? null,
  });
  return NextResponse.json({ id });
}
