import { NextResponse } from "next/server";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createR2Client, getR2Bucket } from "@/lib/r2";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAllowedPrefix(prefix: string): boolean {
  // Limit browsing to our application prefixes for safety
  if (!prefix) return false;
  return prefix === "clients/" || prefix.startsWith("clients/");
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user?.role)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (!["admin", "manager", "architect"].includes(role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    let prefix = url.searchParams.get("prefix") || "clients/";
    if (!prefix.endsWith("/")) prefix = prefix + "/";
    const token = url.searchParams.get("token") || undefined;
    const recursive = url.searchParams.get("recursive") === "1";

    if (!isAllowedPrefix(prefix))
      return NextResponse.json({ error: "Forbidden prefix" }, { status: 403 });

    const r2: S3Client = createR2Client();
    const bucket = getR2Bucket();

    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: recursive ? undefined : "/",
      ContinuationToken: token,
      MaxKeys: 200,
    });
    const out = await r2.send(cmd);
    const folders = recursive
      ? []
      : (out.CommonPrefixes || []).map((cp) => cp.Prefix || "");
    const objects = (out.Contents || [])
      .filter((o) => o.Key && o.Key !== prefix) // skip the prefix placeholder if present
      .map((o) => ({
        key: o.Key!,
        size: o.Size || 0,
        lastModified: o.LastModified ? o.LastModified.toISOString() : null,
        etag: o.ETag || null,
      }));

    return NextResponse.json({
      ok: true,
      prefix,
      folders,
      objects,
      nextToken: out.NextContinuationToken || null,
      isTruncated: !!out.IsTruncated,
    });
  } catch (err) {
    console.error("[GET /api/pliki/r2/list] Error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
