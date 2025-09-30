import { NextResponse } from "next/server";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, getR2Bucket } from "@/lib/r2";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAllowedKey(key: string): boolean {
  return key.startsWith("clients/");
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user?.role)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as {
      fromKey?: string;
      toKey?: string;
    } | null;
    const fromKey = body?.fromKey || "";
    const toKey = body?.toKey || "";
    if (!fromKey || !toKey)
      return NextResponse.json({ error: "Missing keys" }, { status: 400 });
    if (!isAllowedKey(fromKey) || !isAllowedKey(toKey))
      return NextResponse.json({ error: "Forbidden key" }, { status: 403 });

    const r2 = createR2Client();
    const bucket = getR2Bucket();

    // R2 supports CopyObject within bucket
    await r2.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `/${bucket}/${encodeURIComponent(fromKey)}`,
        Key: toKey,
      }),
    );
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: fromKey }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/pliki/r2/move] Error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
