import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Endpoint to download a backup file securely
// Usage: /api/backup/download?file=backup_db_....sql

export async function GET(req: NextRequest) {
  // 1. Check Authentication (simplified here, but should check if user is Admin)
  // In a middleware protected app, we assume the user is logged in to reach this, 
  // but strictly speaking we should verify session here ideally.
  
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("file");

  if (!filename || (!filename.endsWith(".sql") && !filename.endsWith(".tar.gz")) || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "backups", filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  // Return file as attachment
  const contentType = filename.endsWith(".sql") ? "application/sql" : "application/gzip";

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
