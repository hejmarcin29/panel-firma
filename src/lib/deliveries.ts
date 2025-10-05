import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  deliveries,
  deliveryStatusHistory,
  installations,
  orders,
  type DeliveryStage,
  type DeliveryType,
  products,
} from "@db/schema";

import type { CreateDeliveryInput } from "@/lib/deliveries/schemas";

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createDelivery(payload: CreateDeliveryInput, userId: string | null) {
  return db.transaction(async (tx) => {
    const clientRecord = await tx.query.clients.findFirst({
      where: eq(clients.id, payload.clientId),
      columns: { id: true, clientNumber: true },
    });

    if (!clientRecord) {
      throw new Error("Nie znaleziono klienta powiązanego z dostawą.");
    }

    const [countRow] = await tx
      .select({ value: sql<number>`coalesce(count(*), 0)` })
      .from(deliveries)
      .where(eq(deliveries.clientId, payload.clientId));

    const nextSequence = Number(countRow?.value ?? 0) + 1;
    const deliveryNumber = `${clientRecord.clientNumber}_D_${nextSequence}`;
    const now = new Date();

    const record: typeof deliveries.$inferInsert = {
      deliveryNumber,
      type: payload.type,
      clientId: payload.clientId,
      orderId: payload.orderId ?? null,
      installationId: payload.installationId ?? null,
      stage: payload.stage,
      scheduledDate: payload.scheduledDate ?? null,
      includePanels: payload.includePanels,
      panelProductId: payload.panelProductId ?? null,
      panelStyle: normalizeText(payload.panelStyle ?? null),
      includeBaseboards: payload.includeBaseboards,
      baseboardProductId: payload.baseboardProductId ?? null,
      shippingAddressStreet: normalizeText(payload.shippingAddressStreet ?? null),
      shippingAddressCity: normalizeText(payload.shippingAddressCity ?? null),
      shippingAddressPostalCode: normalizeText(payload.shippingAddressPostalCode ?? null),
      notes: normalizeText(payload.notes ?? null),
      proformaIssued: payload.proformaIssued,
      depositOrFinalInvoiceIssued: payload.depositOrFinalInvoiceIssued,
      shippingOrdered: payload.shippingOrdered,
      reviewReceived: payload.reviewReceived,
      requiresAdminAttention: payload.requiresAdminAttention,
      createdAt: now,
      updatedAt: now,
    };

    const [created] = await tx.insert(deliveries).values(record).returning();

    if (!created) {
      throw new Error("Nie udało się utworzyć dostawy.");
    }

    await tx.insert(deliveryStatusHistory).values({
      deliveryId: created.id,
      changedById: userId,
      fromStage: null,
      toStage: created.stage,
      note: created.notes,
      createdAt: now,
    });

    return created;
  });
}

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  FOR_INSTALLATION: "Na potrzeby montażu",
  STANDALONE: "Samodzielna dostawa",
};

export const deliveryStageLabels: Record<DeliveryStage, string> = {
  RECEIVED: "Przyjęto zamówienie",
  PROFORMA_SENT_AWAITING_PAYMENT: "Wysłano proformę – oczekiwanie na płatność",
  SHIPPING_ORDERED: "Zlecono wysyłkę – wysłano zaliczkową (z PF)",
  DELIVERED_AWAITING_FINAL_INVOICE: "Dostarczono – oczekuje na FV końcową",
  COMPLETED: "Koniec",
};

export type DeliveriesSnapshot = {
  metrics: {
    total: number;
    awaitingPayment: number;
    shippingOrdered: number;
    completed: number;
    requiringAttention: number;
  };
  recent: Array<{
    id: string;
    deliveryNumber: string;
    stage: DeliveryStage;
    stageLabel: string;
    scheduledDate: Date | null;
    clientName: string | null;
    type: DeliveryType;
    typeLabel: string;
  }>;
};

export async function getDeliveriesSnapshot(limit = 5): Promise<DeliveriesSnapshot> {
  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      awaitingPayment: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'PROFORMA_SENT_AWAITING_PAYMENT' then 1 else 0 end), 0)`,
      shippingOrdered: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'SHIPPING_ORDERED' then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'COMPLETED' then 1 else 0 end), 0)`,
      requiringAttention: sql<number>`coalesce(sum(case when ${deliveries.requiresAdminAttention} then 1 else 0 end), 0)`,
    })
    .from(deliveries);

  const recentRows = await db
    .select({
      id: deliveries.id,
      deliveryNumber: deliveries.deliveryNumber,
      stage: deliveries.stage,
      scheduledDate: deliveries.scheduledDate,
      clientName: clients.fullName,
      type: deliveries.type,
    })
    .from(deliveries)
    .leftJoin(clients, eq(deliveries.clientId, clients.id))
    .orderBy(desc(deliveries.createdAt))
    .limit(limit);

  const metrics = {
    total: Number(metricsRow?.total ?? 0),
    awaitingPayment: Number(metricsRow?.awaitingPayment ?? 0),
    shippingOrdered: Number(metricsRow?.shippingOrdered ?? 0),
    completed: Number(metricsRow?.completed ?? 0),
    requiringAttention: Number(metricsRow?.requiringAttention ?? 0),
  } as const;

  const recent = recentRows.map((row) => ({
    id: row.id,
    deliveryNumber: row.deliveryNumber,
    stage: row.stage,
    stageLabel: deliveryStageLabels[row.stage],
    scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
    clientName: row.clientName ?? null,
    type: row.type,
    typeLabel: deliveryTypeLabels[row.type],
  }));

  return { metrics, recent };
}

export type DeliverySelectItem = {
  id: string;
  label: string;
  stage: DeliveryStage;
  scheduledDate: Date | null;
};

export async function listDeliveriesForSelect(options?: {
  clientId?: string;
  stages?: DeliveryStage[];
}) {
  const baseQuery = db
    .select({
      id: deliveries.id,
      stage: deliveries.stage,
      scheduledDate: deliveries.scheduledDate,
      clientName: clients.fullName,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      installationId: deliveries.installationId,
      installationLabel: installations.id,
      panelProductName: products.name,
    })
    .from(deliveries)
    .leftJoin(clients, eq(deliveries.clientId, clients.id))
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .leftJoin(installations, eq(deliveries.installationId, installations.id))
    .leftJoin(products, eq(deliveries.panelProductId, products.id))
    .orderBy(desc(deliveries.createdAt));

  const rows = options?.clientId
    ? options?.stages?.length
      ? await baseQuery.where(
          and(eq(deliveries.clientId, options.clientId), inArray(deliveries.stage, options.stages)),
        )
      : await baseQuery.where(eq(deliveries.clientId, options.clientId))
    : options?.stages?.length
      ? await baseQuery.where(inArray(deliveries.stage, options.stages))
      : await baseQuery;

  return rows.map((row) => {
    const reference = row.orderNumber?.trim().length ? row.orderNumber : row.id.slice(0, 6).toUpperCase();
    const title = row.orderTitle?.trim().length ? row.orderTitle : "Dostawa";
    const client = row.clientName ? ` · ${row.clientName}` : "";
    return {
      id: row.id,
      stage: row.stage,
      scheduledDate: row.scheduledDate,
      label: `${reference} – ${title}${client}`,
    } satisfies DeliverySelectItem;
  });
}
