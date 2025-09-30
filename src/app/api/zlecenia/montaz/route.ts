import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createOrderFromBody } from "../_lib";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const json = await req.json().catch(() => null);
    // Delegate to unified creator; keep this route as backward-compat alias for type=installation payloads
    return await createOrderFromBody(session, {
      type: "installation",
      ...(json || {}),
    });
  } catch (err) {
    console.error("[POST /api/zlecenia/montaz] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
