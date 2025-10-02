import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, orders, deliverySlots, installationSlots } from "@/db/schema";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth-session";
import { desc, isNotNull, and, isNull, eq, sql } from "drizzle-orm";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface SessionUser {
  user?: { email?: string | null; role?: string | null } | null;
}

interface ClientCreateBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null; // NIP (opcjonalnie)
  companyName?: string | null;
  invoiceCity?: string | null;
  invoicePostalCode?: string | null;
  invoiceAddress?: string | null;
  invoiceEmail?: string | null;
  buyerType?: "person" | "company" | null;
  source?: string | null;
  // serviceType usunięte z formularza – pozostawiamy pole na przyszłość (ignorowane przy create)
  // Allow unknown extra keys (ignored)
  [key: string]: unknown;
}

// GET /api/klienci - lista klientów (ostatnie najpierw)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const archivedParam = url.searchParams.get("archived");
  const wantArchivedOnly = archivedParam === "1" || archivedParam === "true";
  // Base clients
  const q = db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      deliveryCity: clients.deliveryCity,
      invoiceCity: clients.invoiceCity,
      clientNo: clients.clientNo,
      createdAt: clients.createdAt,
    })
    .from(clients);
  const list = await (wantArchivedOnly
    ? q
        .where(sql`(${clients.archivedAt} IS NOT NULL)`)
        .orderBy(desc(clients.createdAt))
        .limit(200)
    : q
        .where(isNull(clients.archivedAt))
        .orderBy(desc(clients.createdAt))
        .limit(200));

  // For each client gather: activeOrders, nearest delivery/installation dates (planned or confirmed)
  type ClientListOut = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    deliveryCity: string | null;
    invoiceCity: string | null;
    clientNo: number | null;
    createdAt: number;
    _activeOrders: number;
    _nextInstallationAt: number | null;
    _nextDeliveryAt: number | null;
  };
  const out: ClientListOut[] = [];
  for (const c of list) {
    const todayStart = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const toMs = (v: unknown): number | null => {
      if (v == null) return null;
      if (v instanceof Date) return v.getTime();
      if (typeof v === "number" && Number.isFinite(v)) return v;
      return null;
    };
    const [activeOrdersRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.clientId, c.id),
          isNull(orders.archivedAt),
          isNull(orders.outcome),
        ),
      );

    // nearest FUTURE installation via slots
    const [nextInstSlot] = await db
      .select({ t: installationSlots.plannedAt })
      .from(installationSlots)
      .innerJoin(orders, eq(orders.id, installationSlots.orderId))
      .where(
        and(
          eq(orders.clientId, c.id),
          isNull(orders.archivedAt),
          isNull(orders.outcome),
          sql`(${installationSlots.status} in ('planned','confirmed'))`,
          isNotNull(installationSlots.plannedAt),
          sql`${installationSlots.plannedAt} >= ${todayStart}`,
        ),
      )
      .orderBy(installationSlots.plannedAt)
      .limit(1);

    // nearest FUTURE installation via orders.scheduledDate
    const [nextInstOrder] = await db
      .select({ t: orders.scheduledDate })
      .from(orders)
      .where(
        and(
          eq(orders.clientId, c.id),
          isNull(orders.archivedAt),
          isNull(orders.outcome),
          eq(orders.type, "installation"),
          isNotNull(orders.scheduledDate),
          sql`${orders.scheduledDate} >= ${todayStart}`,
        ),
      )
      .orderBy(orders.scheduledDate)
      .limit(1);

    // nearest FUTURE delivery via slots
    const [nextDelSlot] = await db
      .select({ t: deliverySlots.plannedAt })
      .from(deliverySlots)
      .innerJoin(orders, eq(orders.id, deliverySlots.orderId))
      .where(
        and(
          eq(orders.clientId, c.id),
          isNull(orders.archivedAt),
          isNull(orders.outcome),
          sql`(${deliverySlots.status} in ('planned','confirmed'))`,
          isNotNull(deliverySlots.plannedAt),
          sql`${deliverySlots.plannedAt} >= ${todayStart}`,
        ),
      )
      .orderBy(deliverySlots.plannedAt)
      .limit(1);

    // nearest FUTURE delivery via orders.scheduledDate
    const [nextDelOrder] = await db
      .select({ t: orders.scheduledDate })
      .from(orders)
      .where(
        and(
          eq(orders.clientId, c.id),
          isNull(orders.archivedAt),
          isNull(orders.outcome),
          eq(orders.type, "delivery"),
          isNotNull(orders.scheduledDate),
          sql`${orders.scheduledDate} >= ${todayStart}`,
        ),
      )
      .orderBy(orders.scheduledDate)
      .limit(1);
    let nextInstTs = (() => {
      const arr = [toMs(nextInstSlot?.t), toMs(nextInstOrder?.t)].filter(
        (v): v is number => v !== null,
      );
      return arr.length ? Math.min(...arr) : Number.POSITIVE_INFINITY;
    })();
    let nextDelTs = (() => {
      const arr = [toMs(nextDelSlot?.t), toMs(nextDelOrder?.t)].filter(
        (v): v is number => v !== null,
      );
      return arr.length ? Math.min(...arr) : Number.POSITIVE_INFINITY;
    })();

    // If no future dates, fall back to latest past planned/confirmed
    if (!Number.isFinite(nextInstTs)) {
      const [pastInstSlot] = await db
        .select({ t: installationSlots.plannedAt })
        .from(installationSlots)
        .innerJoin(orders, eq(orders.id, installationSlots.orderId))
        .where(
          and(
            eq(orders.clientId, c.id),
            isNull(orders.archivedAt),
            isNull(orders.outcome),
            sql`(${installationSlots.status} in ('planned','confirmed'))`,
            isNotNull(installationSlots.plannedAt),
            sql`${installationSlots.plannedAt} < ${todayStart}`,
          ),
        )
        .orderBy(sql`${installationSlots.plannedAt} DESC`)
        .limit(1);
      const [pastInstOrder] = await db
        .select({ t: orders.scheduledDate })
        .from(orders)
        .where(
          and(
            eq(orders.clientId, c.id),
            isNull(orders.archivedAt),
            isNull(orders.outcome),
            eq(orders.type, "installation"),
            isNotNull(orders.scheduledDate),
            sql`${orders.scheduledDate} < ${todayStart}`,
          ),
        )
        .orderBy(sql`${orders.scheduledDate} DESC`)
        .limit(1);
      const arr = [toMs(pastInstSlot?.t), toMs(pastInstOrder?.t)].filter(
        (v): v is number => v !== null,
      );
      nextInstTs = arr.length ? Math.max(...arr) : Number.NEGATIVE_INFINITY;
    }
    if (!Number.isFinite(nextDelTs)) {
      const [pastDelSlot] = await db
        .select({ t: deliverySlots.plannedAt })
        .from(deliverySlots)
        .innerJoin(orders, eq(orders.id, deliverySlots.orderId))
        .where(
          and(
            eq(orders.clientId, c.id),
            isNull(orders.archivedAt),
            isNull(orders.outcome),
            sql`(${deliverySlots.status} in ('planned','confirmed'))`,
            isNotNull(deliverySlots.plannedAt),
            sql`${deliverySlots.plannedAt} < ${todayStart}`,
          ),
        )
        .orderBy(sql`${deliverySlots.plannedAt} DESC`)
        .limit(1);
      const [pastDelOrder] = await db
        .select({ t: orders.scheduledDate })
        .from(orders)
        .where(
          and(
            eq(orders.clientId, c.id),
            isNull(orders.archivedAt),
            isNull(orders.outcome),
            eq(orders.type, "delivery"),
            isNotNull(orders.scheduledDate),
            sql`${orders.scheduledDate} < ${todayStart}`,
          ),
        )
        .orderBy(sql`${orders.scheduledDate} DESC`)
        .limit(1);
      const arr = [toMs(pastDelSlot?.t), toMs(pastDelOrder?.t)].filter(
        (v): v is number => v !== null,
      );
      nextDelTs = arr.length ? Math.max(...arr) : Number.NEGATIVE_INFINITY;
    }
    out.push({
      id: c.id,
      name: c.name,
      email: (c.email ?? null) as string | null,
      phone: (c.phone ?? null) as string | null,
      deliveryCity: (c.deliveryCity ?? null) as string | null,
      invoiceCity: (c.invoiceCity ?? null) as string | null,
      clientNo: (c.clientNo ?? null) as number | null,
      createdAt: (() => {
        const v = c.createdAt as unknown;
        if (v instanceof Date) return v.getTime();
        if (typeof v === "number") return v;
        return Date.now();
      })(),
      _activeOrders: activeOrdersRow?.c ?? 0,
      _nextInstallationAt: Number.isFinite(nextInstTs) ? nextInstTs : null,
      _nextDeliveryAt: Number.isFinite(nextDelTs) ? nextDelTs : null,
    });
  }

  return NextResponse.json({ clients: out });
}

// POST /api/klienci - utwórz klienta
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = (await req.json().catch(() => null)) as unknown;
    const body: Partial<ClientCreateBody> | null =
      raw && typeof raw === "object"
        ? (raw as Partial<ClientCreateBody>)
        : null;

    const trimOrNull = (v: unknown) => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t === "" ? null : t;
    };

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name)
      return NextResponse.json(
        { error: "Imię i nazwisko wymagane" },
        { status: 400 },
      );

    // Dane bazowe (clientNo wyliczymy poniżej)
    const base: Omit<typeof clients.$inferInsert, "clientNo"> = {
      id: randomUUID(),
      name,
      phone: trimOrNull(body?.phone) ?? null,
      email: trimOrNull(body?.email) ?? null,
      taxId: trimOrNull(body?.taxId) ?? null,
      companyName: trimOrNull(body?.companyName) ?? null,
      invoiceCity: trimOrNull(body?.invoiceCity) ?? null,
      invoicePostalCode: trimOrNull(body?.invoicePostalCode) ?? null,
      invoiceAddress: trimOrNull(body?.invoiceAddress) ?? null,
      invoiceEmail: trimOrNull(body?.invoiceEmail) ?? null,
      buyerType: body?.buyerType === "company" ? "company" : "person",
      source: trimOrNull(body?.source) ?? null,
      // Ustaw jawnie, aby nie łapać NOT NULL przy create
      serviceType: "with_installation",
    };

    // Wylicz next clientNo bez transakcji (retry przy konflikcie unikalności)
    const computeNextNo = async () => {
      const last = await db
        .select({ no: clients.clientNo })
        .from(clients)
        .where(isNotNull(clients.clientNo))
        .orderBy(desc(clients.clientNo))
        .limit(1);
      const maxNo = last[0]?.no ?? null;
      return (maxNo ?? 9) + 1;
    };

    let attempts = 0;
    const maxAttempts = 3;
    let created = false;
    let clientNoAssigned: number | null = null;
    while (!created && attempts < maxAttempts) {
      attempts++;
      const nextNo = await computeNextNo();
      try {
        await db.insert(clients).values({ ...base, clientNo: nextNo });
        clientNoAssigned = nextNo;
        created = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/unique|UNIQUE|constraint/i.test(msg)) {
          // Kolizja numeru – spróbuj ponownie
          continue;
        }
        console.error("[POST /api/klienci] Insert failed", e);
        return NextResponse.json(
          { error: "Błąd serwera (insert)" },
          { status: 500 },
        );
      }
    }
    if (!created) {
      return NextResponse.json(
        { error: "Konflikt numeracji klienta, spróbuj ponownie" },
        { status: 409 },
      );
    }

    const userEmail = (session as SessionUser | null)?.user?.email ?? null;
    await emitDomainEvent({
      type: DomainEventTypes.clientCreated,
      actor: userEmail,
      entity: { type: "client", id: base.id },
      payload: { id: base.id, name: base.name, clientNo: clientNoAssigned },
      schemaVersion: 2,
    });

    return NextResponse.json({ id: base.id });
  } catch (err) {
    console.error("[POST /api/klienci] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
