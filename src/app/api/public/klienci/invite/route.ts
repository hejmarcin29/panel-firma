import { NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { db } from "@/db";
import { clientInvites } from "@/db/schema";
import { getSession, isUserRole } from "@/lib/auth-session";

type Body = {
  allowedFields?: string[];
  expiresInHours?: number; // default 168h = 7 days
};

function makeToken() {
  // 24 bytes -> 32 chars base64url approx; good enough and URL-safe
  return randomBytes(24).toString("base64url");
}

export async function POST(req: Request) {
  const session = await getSession();
  const role = session?.user?.role;
  if (!role || !isUserRole(role) || role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const userEmail = session?.user?.email ?? null;

  const url = new URL(req.url);
  const origin = url.origin;

  const json = (await req.json().catch(() => null)) as Body | null;
  const hours = Math.max(1, Math.min(24 * 30, Math.floor(json?.expiresInHours ?? 24 * 7)));
  const allowed = Array.isArray(json?.allowedFields) && json!.allowedFields!.length > 0
    ? json!.allowedFields!
    : ["name", "phone", "email", "source"];

  const now = Date.now();
  const expiresAt = new Date(now + hours * 60 * 60 * 1000);
  const id = randomUUID();
  const token = makeToken();

  await db.insert(clientInvites).values({
    id,
    token,
    purpose: "new_client",
    allowedFieldsJson: JSON.stringify(allowed),
    expiresAt,
    createdAt: new Date(now),
    createdBy: userEmail ?? null,
  });

  const publicUrl = `${origin}/public/klienci/${encodeURIComponent(token)}`;
  return NextResponse.json({ id, token, url: publicUrl, expiresAt: expiresAt.getTime(), allowedFields: allowed });
}
