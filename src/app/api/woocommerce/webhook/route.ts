import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { upsertIncomingWpOrder, type WooOrderPayload } from "@/lib/wp-orders";

export const runtime = "nodejs";

function verifySignature(body: string, providedSignature: string, secret: string): boolean {
  const computed = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  const computedBuffer = Buffer.from(computed, "base64");
  const providedBuffer = Buffer.from(providedSignature, "base64");

  if (computedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Brak konfiguracji WOOCOMMERCE_WEBHOOK_SECRET.");
    return NextResponse.json({ ok: false, error: "Brak konfiguracji webhooka." }, { status: 500 });
  }

  const signature = request.headers.get("x-wc-webhook-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Brak podpisu webhooka." }, { status: 400 });
  }

  const body = await request.text();

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Niepoprawny podpis webhooka." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    console.error("Nie udało się sparsować payloadu webhooka", error);
    return NextResponse.json({ ok: false, error: "Niepoprawny JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Pusty payload." }, { status: 400 });
  }

  try {
    const summary = await upsertIncomingWpOrder(payload as WooOrderPayload, body);
    revalidatePath("/panel");
    return NextResponse.json({ ok: true, orderId: summary.wpOrderId, containsVinylPanels: summary.containsVinylPanels });
  } catch (error) {
    console.error("Błąd podczas zapisu zamówienia WooCommerce", error);
    return NextResponse.json({ ok: false, error: "Błąd podczas zapisu zamówienia." }, { status: 500 });
  }
}
