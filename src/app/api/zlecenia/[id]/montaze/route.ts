import { NextResponse } from "next/server";

// Etap 2: API dla slotów montażowych zostało usunięte. Zwracamy 410 Gone.
export async function GET() {
  return NextResponse.json({ error: "Endpoint removed" }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: "Endpoint removed" }, { status: 410 });
}
