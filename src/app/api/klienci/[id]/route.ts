import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  clients,
  clientNotes,
  deliverySlots,
  installationSlots,
  orders,
  type Client,
} from "@/db/schema";
import { eq, desc, and, isNull, isNotNull, sql, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";

interface SessionUser {
  user?: {
    email?: string | null;
    role?: string | null;
  } | null;
}

type UpdatableClientField =
  | "name"
  | "phone"
  | "email"
  | "taxId"
  | "companyName"
  | "invoiceCity"
  | "invoicePostalCode"
  | "invoiceAddress"
  | "source"
  | "preferVatInvoice"
  | "buyerType"
  | "invoiceEmail"
  | "eInvoiceConsent";
type ClientUpdateBody = Partial<Record<UpdatableClientField, unknown>> & {
  [k: string]: unknown;
};
interface FieldChange {
  field: UpdatableClientField;
  before: string | boolean | null;
  after: string | boolean | null;
}

// GET /api/klienci/[id]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  if (!client)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  // nearest FUTURE dates via slots
  const [nextInstSlot] = await db
    .select({ t: installationSlots.plannedAt })
    .from(installationSlots)
    .innerJoin(orders, eq(orders.id, installationSlots.orderId))
    .where(
      and(
        eq(orders.clientId, id),
        isNull(orders.archivedAt),
        isNull(orders.outcome),
        sql`(${installationSlots.status} in ('planned','confirmed'))`,
        isNotNull(installationSlots.plannedAt),
        sql`${installationSlots.plannedAt} >= ${todayStart}`,
      ),
    )
    .orderBy(installationSlots.plannedAt)
    .limit(1);
  const [nextInstOrder] = await db
    .select({ t: orders.scheduledDate })
    .from(orders)
    .where(
      and(
        eq(orders.clientId, id),
        isNull(orders.archivedAt),
        isNull(orders.outcome),
        eq(orders.type, "installation"),
        isNotNull(orders.scheduledDate),
        sql`${orders.scheduledDate} >= ${todayStart}`,
      ),
    )
    .orderBy(orders.scheduledDate)
    .limit(1);
  const [nextDelSlot] = await db
    .select({ t: deliverySlots.plannedAt })
    .from(deliverySlots)
    .innerJoin(orders, eq(orders.id, deliverySlots.orderId))
    .where(
      and(
        eq(orders.clientId, id),
        isNull(orders.archivedAt),
        isNull(orders.outcome),
        sql`(${deliverySlots.status} in ('planned','confirmed'))`,
        isNotNull(deliverySlots.plannedAt),
        sql`${deliverySlots.plannedAt} >= ${todayStart}`,
      ),
    )
    .orderBy(deliverySlots.plannedAt)
    .limit(1);
  const [nextDelOrder] = await db
    .select({ t: orders.scheduledDate })
    .from(orders)
    .where(
      and(
        eq(orders.clientId, id),
        isNull(orders.archivedAt),
        isNull(orders.outcome),
        eq(orders.type, "delivery"),
        isNotNull(orders.scheduledDate),
        sql`${orders.scheduledDate} >= ${todayStart}`,
      ),
    )
    .orderBy(orders.scheduledDate)
    .limit(1);
  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, id))
    .orderBy(desc(clientNotes.createdAt));
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

  if (!Number.isFinite(nextInstTs)) {
    const [pastInstSlot] = await db
      .select({ t: installationSlots.plannedAt })
      .from(installationSlots)
      .innerJoin(orders, eq(orders.id, installationSlots.orderId))
      .where(
        and(
          eq(orders.clientId, id),
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
          eq(orders.clientId, id),
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
          eq(orders.clientId, id),
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
          eq(orders.clientId, id),
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
  return NextResponse.json({
    client: {
      ...client,
      archivedAt: toMs(
        (client as unknown as { archivedAt?: number | Date | null })
          ?.archivedAt ?? null,
      ),
      _nextInstallationAt: Number.isFinite(nextInstTs) ? nextInstTs : null,
      _nextDeliveryAt: Number.isFinite(nextDelTs) ? nextDelTs : null,
    },
    notes,
  });
}

// PATCH /api/klienci/[id] - aktualizacja danych klienta
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: ClientUpdateBody =
    raw && typeof raw === "object" ? (raw as ClientUpdateBody) : {};
  const fields: UpdatableClientField[] = [
    "name",
    "phone",
    "email",
    "taxId",
    "companyName",
    "invoiceCity",
    "invoicePostalCode",
    "invoiceAddress",
    "source",
    "preferVatInvoice",
    "buyerType",
    "invoiceEmail",
    "eInvoiceConsent",
  ];

  const [before] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  if (!before)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const userEmail = (session as SessionUser | null)?.user?.email ?? null;

  const updates: Partial<
    Record<UpdatableClientField, string | null | boolean>
  > = {};
  const changes: FieldChange[] = [];

  const normalize = (
    v: unknown,
    field: UpdatableClientField,
  ): string | null | boolean => {
    if (field === "preferVatInvoice" || field === "eInvoiceConsent") {
      return !!v;
    }
    if (v == null) return field === "name" ? null : null; // name null filtered later
    if (typeof v !== "string") return null;
    const t = v.trim();
    if (t === "") return null;
    return t;
  };

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      const incoming = normalize(body[f], f);
      const prev = before[f as keyof Client] as unknown as string | null; // all updatable fields are string|null in schema
      if ((prev ?? null) !== (incoming ?? null)) {
        // Do not allow setting required name to null
        if (f === "name" && incoming === null) {
          // skip invalid null assignment
        } else {
          updates[f] = incoming;
        }
        changes.push({
          field: f,
          before: (prev ?? null) as string | boolean | null,
          after: (incoming ?? null) as string | boolean | null,
        });
      }
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  // Build set object with only provided keys. Drizzle's columns accept null for nullable fields.
  const setObject: Partial<Client> = {};
  (
    Object.entries(updates) as [UpdatableClientField, string | null | boolean][]
  ).forEach(([k, v]) => {
    if (v === undefined) return;
    switch (k) {
      case "name":
        if (typeof v === "string") setObject.name = v;
        break;
      case "phone":
        setObject.phone = v as string | null;
        break;
      case "email":
        setObject.email = v as string | null;
        break;
      case "taxId":
        setObject.taxId = v as string | null;
        break;
      case "companyName":
        setObject.companyName = v as string | null;
        break;
      case "invoiceCity":
        setObject.invoiceCity = v as string | null;
        break;
      case "invoicePostalCode":
        setObject.invoicePostalCode = v as string | null;
        break;
      case "invoiceAddress":
        setObject.invoiceAddress = v as string | null;
        break;
      case "source":
        setObject.source = v as string | null;
        break;
      case "preferVatInvoice":
        setObject.preferVatInvoice = Boolean(v);
        break;
      case "buyerType":
        setObject.buyerType = typeof v === "string" ? v : null;
        break;
      case "invoiceEmail":
        setObject.invoiceEmail = v as string | null;
        break;
      case "eInvoiceConsent":
        setObject.eInvoiceConsent = Boolean(v);
        break;
    }
  });
  await db.update(clients).set(setObject).where(eq(clients.id, id));
  await emitDomainEvent({
    type: DomainEventTypes.clientUpdated,
    actor: userEmail,
    entity: { type: "client", id },
    payload: { id, changedFields: Object.keys(updates), changes },
    schemaVersion: 2,
  });
  // Zmiana serviceType usunięta z logiki — brak dodatkowego eventu
  return NextResponse.json({ ok: true });
}

// DELETE /api/klienci/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userEmail = (session as SessionUser | null)?.user?.email ?? null;

  // Soft-archive client and all their orders in a transaction
  const now = new Date();
  await db.transaction(async (tx) => {
    // Verify client exists and not already archived
    const [c] = await tx
      .select({ id: clients.id, archivedAt: clients.archivedAt })
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    if (!c) throw new Error("Not found");
    if (c.archivedAt) return; // idempotent

    await tx.update(clients).set({ archivedAt: now }).where(eq(clients.id, id));

    // Archive all active orders for this client
    const orderIdsToArchive = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.clientId, id), isNull(orders.archivedAt)))
      .then((rows) => rows.map((r) => r.id));
    if (orderIdsToArchive.length > 0) {
      await tx
        .update(orders)
        .set({ archivedAt: now })
        .where(inArray(orders.id, orderIdsToArchive));
      await emitDomainEvent({
        type: DomainEventTypes.ordersArchivedForClient,
        actor: userEmail,
        entity: { type: "client", id },
        payload: { clientId: id, count: orderIdsToArchive.length },
      });
    }
  });

  await emitDomainEvent({
    type: DomainEventTypes.clientArchived,
    actor: userEmail,
    entity: { type: "client", id },
    payload: { id },
  });
  return NextResponse.json({ ok: true });
}
