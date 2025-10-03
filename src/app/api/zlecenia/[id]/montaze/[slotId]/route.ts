import { NextResponse } from "next/server";

// Etap 2: endpoint usunięty – zwracamy 410 Gone
export async function PATCH() {
  return NextResponse.json({ error: "Endpoint removed" }, { status: 410 });
}
