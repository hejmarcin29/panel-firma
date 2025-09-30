import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, getR2Bucket } from "@/lib/r2";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAllowedKey(key: string): boolean {
  return key.startsWith("clients/");
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user?.role)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";
    if (!key)
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    if (!isAllowedKey(key))
      return NextResponse.json({ error: "Forbidden key" }, { status: 403 });

    const r2 = createR2Client();
    const bucket = getR2Bucket();
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/pliki/r2/object] Error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
