import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { clients, clientInvites } from "@/db/schema";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

const ALLOWED_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "taxId",
  "companyName",
  "invoiceCity",
  "invoicePostalCode",
  "invoiceAddress",
  "source",
]);

async function getInviteByToken(token: string) {
  const rows = await db
    .select()
    .from(clientInvites)
    .where(
      and(
        eq(clientInvites.token, token),
        isNull(clientInvites.usedAt),
        eq(clientInvites.purpose, "onboarding"),
      ),
    );
  const inv = rows[0];
  if (!inv) return null;
  const now = Date.now();
  const exp = inv.expiresAt instanceof Date ? inv.expiresAt.getTime() : inv.expiresAt ?? null;
  if (exp && exp < now) return null;
  return inv;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInviteByToken(token);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let allowed: string[];
  try {
    const parsed = JSON.parse(inv.allowedFieldsJson ?? "[]");
    if (Array.isArray(parsed)) {
      allowed = parsed.filter((k: unknown) => typeof k === "string" && ALLOWED_FIELDS.has(k as string));
    } else allowed = ["name", "phone", "email", "source"];
  } catch {
    allowed = ["name", "phone", "email", "source"];
  }
  return NextResponse.json({ allowedFields: allowed, purpose: inv.purpose, expiresAt: inv.expiresAt });
}

const submitSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6).optional().nullable(),
  email: z.string().email().optional().nullable(),
  taxId: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  invoiceCity: z.string().optional().nullable(),
  invoicePostalCode: z.string().optional().nullable(),
  invoiceAddress: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInviteByToken(token);
  if (!inv) return NextResponse.json({ error: "Invalid token" }, { status: 404 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  // Restrict to allowed fields
  let allowed: string[];
  try {
    const arr = JSON.parse(inv.allowedFieldsJson ?? "[]");
    allowed = Array.isArray(arr) ? arr.filter((k: unknown) => typeof k === "string") : [];
  } catch {
    allowed = [];
  }
  const payload: Record<string, unknown> = {};
  for (const k of Object.keys(parsed.data)) {
    if (allowed.includes(k)) payload[k] = (parsed.data as Record<string, unknown>)[k];
  }
  // name must always be present
  const name = (payload.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const trimOrNull = (v: unknown) => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t === "" ? null : t;
  };

  const base: Omit<typeof clients.$inferInsert, "clientNo"> = {
    id: randomUUID(),
    name,
    phone: trimOrNull(payload.phone) ?? null,
    email: trimOrNull(payload.email) ?? null,
    taxId: trimOrNull(payload.taxId) ?? null,
    companyName: trimOrNull(payload.companyName) ?? null,
    invoiceCity: trimOrNull(payload.invoiceCity) ?? null,
    invoicePostalCode: trimOrNull(payload.invoicePostalCode) ?? null,
    invoiceAddress: trimOrNull(payload.invoiceAddress) ?? null,
    source: trimOrNull(payload.source) ?? "Public form",
    serviceType: "with_installation",
  };

  // compute clientNo with retry
  const getNextNo = async () => {
    const last = await db
      .select({ no: clients.clientNo })
      .from(clients)
      .where(isNotNull(clients.clientNo))
      .orderBy(desc(clients.clientNo))
      .limit(1);
    const maxNo = last[0]?.no ?? null;
    return (maxNo ?? 9) + 1;
  };

  let created = false;
  let attempts = 0;
  while (!created && attempts < 3) {
    attempts++;
    const nextNo = await getNextNo();
    try {
      await db.insert(clients).values({ ...base, clientNo: nextNo });
      created = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/unique|UNIQUE|constraint/i.test(msg)) continue;
      console.error("[public client submit] insert failed", e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
  if (!created) return NextResponse.json({ error: "Conflict, try again" }, { status: 409 });

  // mark invite used
  await db
    .update(clientInvites)
    .set({ usedAt: new Date(), resultClientId: base.id })
    .where(eq(clientInvites.id, inv.id));

  // Create a portal link (rotowalny, bez expires) – Phase 1
  let portalUrl: string | null = null;
  let portalToken: string | null = null;
  let portalExpiresAt: number | null = null;
  try {
    portalToken = crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();
    const expiresAt = new Date(now + 90 * 24 * 60 * 60 * 1000); // domyślnie 90 dni
    await db.insert(clientInvites).values({
      id: crypto.randomUUID(),
      token: portalToken,
      purpose: "portal",
      clientId: base.id,
      allowEdit: false,
      expiresAt,
      createdAt: new Date(),
      createdBy: "system",
    });
    const origin = new URL("/", req.url).origin;
    portalUrl = `${origin}/public/klient/${encodeURIComponent(portalToken)}`;
    portalExpiresAt = expiresAt.getTime();
  } catch (e) {
    console.error("[public onboarding] failed to create portal link", e);
  }

  await emitDomainEvent({
    type: DomainEventTypes.clientCreated,
    actor: "public",
    entity: { type: "client", id: base.id },
    payload: { id: base.id, name: base.name },
    schemaVersion: 2,
  });

  return NextResponse.json({ id: base.id, portalUrl, portalToken, portalExpiresAt });
}
