import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  clients,
  orders,
  orderNoteHistory,
  type Order,
  users,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { emitDomainEvent, DomainEventTypes } from "@/domain/events";
import type { SessionLike } from "@/lib/auth-session";

const START_STATUS: Record<"delivery" | "installation", Order["status"]> = {
  delivery: "ready_to_schedule",
  installation: "awaiting_measurement",
};

export const createOrderBodySchema = z.object({
  clientId: z.string().uuid({ message: "Nieprawidłowy identyfikator klienta" }),
  type: z.enum(["delivery", "installation"]).default("installation"),
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.number().int().positive().optional(),
  installerId: z.string().uuid().optional(),
  scheduledDate: z.number().int().positive().optional(),
  orderPlacedAt: z.number().int().positive().optional(),
  // Możliwość nadpisania adresu realizacji przy tworzeniu (np. adres dostawy różny od faktury)
  locationCity: z.string().optional(),
  locationPostalCode: z.string().optional(),
  locationAddress: z.string().optional(),
  // Installation extras (opcjonalne)
  proposedInstallPriceCents: z.number().int().positive().optional(),
  buildingType: z.enum(["house", "apartment"]).optional(),
  desiredInstallFrom: z.number().int().positive().optional(),
  desiredInstallTo: z.number().int().positive().optional(),
});

export async function createOrderFromBody(
  session: SessionLike | null,
  raw: unknown,
) {
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createOrderBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Błąd walidacji", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const {
    clientId,
    type,
    note,
    preMeasurementSqm,
    installerId,
    scheduledDate,
    orderPlacedAt,
    proposedInstallPriceCents,
    buildingType,
    desiredInstallFrom,
    desiredInstallTo,
  } = parsed.data;
  const locCity = (parsed.data.locationCity ?? "").trim();
  const locPostal = (parsed.data.locationPostalCode ?? "").trim();
  const locAddr = (parsed.data.locationAddress ?? "").trim();

  const [client] = await db
    .select({
      id: clients.id,
      invoiceCity: clients.invoiceCity,
      invoicePostalCode: clients.invoicePostalCode,
      invoiceAddress: clients.invoiceAddress,
    })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client)
    return NextResponse.json({ error: "Klient nie istnieje" }, { status: 400 });

  if (installerId) {
    const [inst] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, installerId))
      .limit(1);
    if (!inst)
      return NextResponse.json(
        { error: "Montażysta nie istnieje" },
        { status: 400 },
      );
    if (inst.role !== "installer")
      return NextResponse.json(
        { error: "Użytkownik nie jest montażystą" },
        { status: 400 },
      );
  }

  const id = randomUUID();
  const status = START_STATUS[type];
  const now = new Date();
  const createdAt = orderPlacedAt ? new Date(orderPlacedAt) : now;

  // Pobierz clientNo (może być null, wtedy orderNo też null)
  const [c] = await db
    .select({ clientNo: clients.clientNo })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  const clientNo = c?.clientNo ?? null;

  // Bez transakcji: policz seq i spróbuj wstawić; na konflikt spróbuj ponownie (do 3 razy)
  let attempts = 0;
  let inserted = false;
  while (!inserted && attempts < 3) {
    attempts++;
    const last = await db
      .select({ s: orders.seq })
      .from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.seq))
      .limit(1);
    const maxSeq = last[0]?.s ?? null;
    const nextSeq = (maxSeq ?? 0) + 1;
    const orderNo = clientNo != null ? `${clientNo}_${nextSeq}` : null;
    try {
      await db.insert(orders).values({
        id,
        clientId,
        type,
        status,
        requiresMeasurement: type === "installation",
        installerId: installerId ?? null,
        preMeasurementSqm: preMeasurementSqm ?? null,
        internalNote: note ? note : null,
        internalNoteUpdatedAt: note ? createdAt : null,
        seq: nextSeq,
        orderNo,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdAt,
        // Prefill location from client's invoice address, z opcją nadpisania z body
        locationCity: locCity !== "" ? locCity : (client?.invoiceCity ?? null),
        locationPostalCode:
          locPostal !== ""
            ? locPostal
            : ((client as { invoicePostalCode?: string | null })
                ?.invoicePostalCode ?? null),
        locationAddress:
          locAddr !== "" ? locAddr : (client?.invoiceAddress ?? null),
        // Installation extras
        proposedInstallPriceCents: proposedInstallPriceCents ?? null,
        buildingType: buildingType ?? null,
        desiredInstallFrom: desiredInstallFrom ? new Date(desiredInstallFrom) : null,
        desiredInstallTo: desiredInstallTo ? new Date(desiredInstallTo) : null,
      });
      inserted = true;
    } catch (err) {
      const msg = (err as Error).message || "";
      if (/UNIQUE\s+constraint/i.test(msg)) {
        // wyścig – spróbuj ponownie z kolejnym seq
        continue;
      }
      throw err;
    }
  }
  if (!inserted) {
    return NextResponse.json(
      { error: "Nie udało się wygenerować numeru zlecenia" },
      { status: 409 },
    );
  }

  if (note) {
    await db.insert(orderNoteHistory).values({
      id: randomUUID(),
      orderId: id,
      content: note,
      editedBy: session.user?.email ?? null,
      editedAt: now,
    });
  }

  // fetch numbers for enriched payload + emit event (nie blokuj odpowiedzi jeśli event padnie)
  try {
    const [created] = await db
      .select({ orderNo: orders.orderNo, clientNo: clients.clientNo })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))
      .limit(1);
    await emitDomainEvent({
      type: DomainEventTypes.orderCreated,
      actor: session.user?.email ?? "system",
      entity: { type: "order", id },
      payload: {
        id,
        clientId,
        type,
        status,
        clientNo: created?.clientNo ?? null,
        orderNo: created?.orderNo ?? null,
      },
    });
  } catch (e) {
    console.error("[event order.created] emit failed (non-blocking)", e);
  }

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
