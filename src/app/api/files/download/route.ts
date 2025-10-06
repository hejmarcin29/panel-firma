import { NextResponse } from "next/server";

import { getObjectDownloadUrl } from "@/lib/r2";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Brakuje parametru `key`." }, { status: 400 });
  }

  try {
    const url = await getObjectDownloadUrl(key);
    return NextResponse.redirect(url, 302);
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać pliku." }, { status: 404 });
  }
}
